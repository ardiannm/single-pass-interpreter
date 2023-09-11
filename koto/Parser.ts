import Program from "./ast/expressions/Program";
import Expression from "./ast/expressions/Expression";
import Slash from "./ast/operators/Slash";
import Power from "./ast/operators/Power";
import Identifier from "./ast/expressions/Identifier";
import GreaterThan from "./ast/tokens/GreaterThan";
import SelfClosingHTMLElement from "./ast/html/SelfClosingHTMLElement";
import LinientComponent from "./ast/html/LenientComponent";
import Equals from "./ast/tokens/Equals";
import Minus from "./ast/operators/Minus";
import EOF from "./ast/tokens/EOF";
import OpenTag from "./ast/html/OpenTag";
import Attribute from "./ast/html/Attribute";
import Plus from "./ast/operators/Plus";
import Product from "./ast/operators/Product";
import OpenParenthesis from "./ast/tokens/OpenParenthesis";
import CloseParenthesis from "./ast/tokens/CloseParenthesis";
import Character from "./ast/tokens/Character";
import Quote from "./ast/tokens/Quote";
import Substraction from "./ast/expressions/Substraction";
import Identity from "./ast/expressions/Identity";
import Negation from "./ast/expressions/Negation";
import Division from "./ast/expressions/Division";
import Addition from "./ast/expressions/Addition";
import Multiplication from "./ast/expressions/Multiplication";
import Exponentiation from "./ast/expressions/Exponentiation";
import String from "./ast/expressions/String";
import Parenthesis from "./ast/expressions/Parenthesis";
import CloseTag from "./ast/html/CloseTag";
import LessThan from "./ast/tokens/LessThan";
import OpenScriptTag from "./ast/html/OpenScriptTag";
import CloseScriptTag from "./ast/html/CloseScriptTag";
import HTMLScript from "./ast/html/HTMLScript";
import HTMLElement from "./ast/html/HTMLElement";
import HTMLComponent from "./ast/html/HTMLComponent";
import ParserService from "./services/ParserService";
import ExclamationMark from "./ast/tokens/ExclamationMark";
import HTMLComment from "./ast/html/HTMLComment";
import HTMLTextContent from "./ast/html/HTMLTextContent";
import Number from "./ast/expressions/Number";
import Interpolation from "./ast/expressions/Interpolation";
import OpenBrace from "./ast/tokens/OpenBrace";
import CloseBrace from "./ast/tokens/CloseBrace";
import SpreadsheetCell from "./ast/spreadsheet/SpreadsheetCell";
import Colon from "./ast/tokens/Colon";
import SpreadsheetRange from "./ast/spreadsheet/SpreadsheetRange";
import BadToken from "./ast/tokens/BadToken";
import Dot from "./ast/tokens/Dot";
import SemiColon from "./ast/tokens/SemiColon";
import Import from "./ast/expressions/Import";
import ImportFile from "./services/ImportFile";
import HTML from "./ast/html/HTML";

const lenientTags = ["link", "br", "input", "img", "hr", "meta", "col", "textarea", "head"];

export default class Parser extends ParserService {
  public parse() {
    return this.parseProgram();
  }

  private parseProgram() {
    this.doNotExpect(this.peekToken(), EOF, "source file is empty");
    const expressions = new Array<Expression>();
    while (this.hasMoreTokens()) {
      const expression = this.parseExpression();
      expressions.push(expression);
    }
    return new Program(expressions);
  }

  private parseExpression(): Expression {
    if ((this.peekToken() as Identifier).view === "using") {
      this.getNextToken();
      return this.parseImport();
    }
    if ((this.peekToken() as Identifier).view === "DOCTYPE") {
      this.getNextToken();
      return this.parseHTMLComponent();
    }
    return this.parseTerm();
  }

  private parseImport() {
    const errorMessage = "expecting a namespace identifier for module import";
    const token = this.expect(this.getNextToken(), Identifier, errorMessage);
    let nameSpace = token.view;
    while (this.peekToken() instanceof Dot) {
      this.getNextToken();
      nameSpace += "." + this.expect(this.getNextToken(), Identifier, errorMessage).view;
    }
    this.trackPosition();
    this.expect(this.getNextToken(), SemiColon, "semicolon `;` expected after an import statement");
    this.untrackPosition();
    const path = nameSpace.replace(/\./g, "/") + ".txt";
    let sourceCode = "";
    let namesSpaces = nameSpace.split(".");
    let lastNameSpace = namesSpaces[namesSpaces.length - 1];
    try {
      sourceCode = ImportFile(path);
    } catch (error) {
      this.throwError(`namespace \`${lastNameSpace}\` does not exist`);
    }
    try {
      this.trackPosition();
      const program = new Parser(sourceCode, path).parse();
      this.untrackPosition();
      return new Import(nameSpace, program);
    } catch (error) {
      console.log(error);
      this.throwError(`internal error found in \`${lastNameSpace}\` code base at \`./${path}\``);
    }
  }

  // this.throwError(`mismatching \`${right.tag}\` found for the \`${left.tag}\` tag`);
  // this.throwError(`expecting a closing \`${left.tag}\` tag`);

  private parseHTMLComponent(): HTML {
    const left = this.parseHTMLTextContent();
    const from = this.pointer;
    if (left instanceof OpenTag) {
      const children = new Array<HTMLComponent>();
      while (this.hasMoreTokens()) {
        const token = this.parseHTMLComponent();
        if (token instanceof HTMLComponent) {
          children.push(token);
          continue;
        }
        const right = this.expect(token, CloseTag, `expecting a closing \`${left.tag}\` tag but mached \`${token.type}\``);
        if (left.tag !== right.tag) {
          if (lenientTags.includes(left.tag)) {
            this.pointer = from;
            return new LinientComponent(left.tag, left.attributes);
          }
          this.throwError(`\`${right.tag}\` is not a match for \`${left.tag}\` tag`);
        }
        return new HTMLElement(left.tag, children);
      }
      if (lenientTags.includes(left.tag)) return left;
      this.throwError(`expecting a closing \`${left.tag}\` tag`);
    }
    return left;
  }

  private parseHTMLTextContent() {
    let view = "";
    this.considerSpace();
    if (this.peekToken() instanceof LessThan) {
      this.ignoreSpace();
      return this.parseHTMLScript();
    }
    while (this.hasMoreTokens()) {
      if (this.peekToken() instanceof LessThan) break;
      view += this.getNext();
    }
    this.ignoreSpace();
    if (/^\s+$/.test(view)) {
      return this.parseHTMLTextContent();
    }
    return new HTMLTextContent(view);
  }

  private parseHTMLScript() {
    const left = this.parseTag();
    if (left instanceof OpenScriptTag) {
      let view = "";
      const right = this.parseHTMLTextContent();
      if (right instanceof HTMLTextContent) {
        view = right.view;
        this.trackPosition();
        const token = this.parseTag();
        this.expect(token, CloseScriptTag, `expecting \`CloseScriptTag\` but matched \`${token.type}\``);
        this.untrackPosition();
        return new HTMLScript(view);
      }
      this.expect(right, CloseScriptTag, `expecting \`CloseScriptTag\` but matched \`${right.type}\``);
      return new HTMLScript(view);
    }
    return left;
  }

  private parseTag() {
    const left = this.parseHTMLComment();
    if (left instanceof HTMLComment) return left;
    if (this.peekToken() instanceof Slash) {
      this.getNextToken();
      const identifier = this.expect(this.parseTagIdentifier(), Identifier, "expecting identifier for closing tag");
      this.expect(this.getNextToken(), GreaterThan, "expecting `>` for closing tag");
      if (identifier.view === "script") return new CloseScriptTag();
      return new CloseTag(identifier.view);
    }
    const identifier = this.expect(this.parseTagIdentifier(), Identifier, "expecting identifier for open tag");
    const attributes = new Array<Attribute>();
    while (this.peekToken() instanceof Identifier) {
      attributes.push(this.parseAttribute());
    }
    if (this.peekToken() instanceof Slash) {
      const token = this.getNextToken() as Character;
      this.expect(this.getNextToken(), GreaterThan, `expecting closing token \`>\` but matched \`${token.view}\` after tag name identifier \`${identifier.view}\``);
      return new SelfClosingHTMLElement(identifier.view, attributes);
    }
    const token = this.getNextToken() as Character;
    this.expect(token, GreaterThan, `expecting a closing \`>\` for \`${identifier.view}\` open tag but matched \`${token.view}\` character`);
    if (identifier.view === "script") return new OpenScriptTag();
    return new OpenTag(identifier.view, attributes);
  }

  private parseHTMLComment() {
    const left = this.expect(this.getNextToken(), LessThan, "expecting `<` for an html tag");
    if (this.peekToken() instanceof ExclamationMark) {
      this.trackPosition();
      this.expect(this.getNextToken(), ExclamationMark, "expecting `!` for a comment");
      const errorMessage = "expecting `--` after `!` for a comment";
      this.expect(this.getNextToken(), Minus, errorMessage);
      this.expect(this.getNextToken(), Minus, errorMessage);
      let view = "";
      while (this.hasMoreTokens()) {
        if (this.peekToken() instanceof Minus) {
          const keep = this.pointer;
          this.getNextToken();
          const token = this.peekToken();
          this.doNotExpect(token, GreaterThan, "expecting `--` before `>` for a comment");
          if (token instanceof Minus) {
            this.getNextToken();
            this.expect(this.getNextToken(), GreaterThan, "expecting `>` for comment");
            this.untrackPosition();
            return new HTMLComment(view);
          }
          this.pointer = keep;
        }
        view += this.getNext();
      }
      this.throwError("unexpected end of comment");
    }
    return left;
  }

  private parseTagIdentifier() {
    const identifier = this.expect(this.getNextToken(), Identifier, "expecting leading identifier for html tag name");
    let view = identifier.view;
    this.considerSpace();
    while (this.peekToken() instanceof Identifier || this.peekToken() instanceof Minus || this.peekToken() instanceof Number) {
      const token = this.getNextToken() as Identifier | Minus | Number;
      if (token instanceof Minus && !(this.peekToken() instanceof Identifier) && !(this.peekToken() instanceof Number)) {
        this.throwError("expecting an ending number or identifier for the name tag");
      }
      view += token.view;
    }
    this.ignoreSpace();
    return new Identifier(view);
  }

  private parseAttribute() {
    let property = "";
    if (this.peekToken() instanceof Identifier) {
      this.considerSpace();
      property += (this.getNextToken() as Character).view;
    }
    while (this.peekToken() instanceof Identifier || this.peekToken() instanceof Minus || this.peekToken() instanceof Number || this.peekToken() instanceof Colon) {
      property += (this.getNextToken() as Character).view;
    }
    this.ignoreSpace();
    let value = "";
    if (this.peekToken() instanceof Equals) {
      this.getNextToken();
      const token = this.peekToken() as Character;
      value = this.expect(this.parseString(), String, `expecting a string value after \`=\` following a tag property but matched \`${token.view}\``).view;
    }
    return new Attribute(property, value);
  }

  private parseTerm() {
    const left = this.parseFactor();
    const token = this.peekToken();
    if (token instanceof Plus || token instanceof Minus) {
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      this.trackPosition();
      const right = this.expect(this.parseTerm(), Expression, "invalid right hand side in binary expression");
      this.untrackPosition();
      if (token instanceof Plus) return new Addition(left, right);
      return new Substraction(left, right);
    }
    return left;
  }

  private parseFactor() {
    const left = this.parseExponent();
    const token = this.peekToken();
    if (token instanceof Product || token instanceof Slash) {
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      this.trackPosition();
      const right = this.expect(this.parseFactor(), Expression, "invalid right hand side in binary expression");
      this.untrackPosition();
      if (token instanceof Product) return new Multiplication(left, right);
      return new Division(left, right);
    }
    return left;
  }

  private parseExponent() {
    let left = this.parseUnary();
    if (this.peekToken() instanceof Power) {
      this.getNextToken();
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      const right = this.expect(this.parseExponent(), Expression, "invalid right hand side in binary expression");
      left = new Exponentiation(left, right);
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.peekToken() instanceof Plus || this.peekToken() instanceof Minus) {
      const operator = this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of unary expression");
      const right = this.expect(this.parseUnary(), Expression, "invalid expression in unary expression");
      if (operator instanceof Plus) return new Identity(right);
      return new Negation(right);
    }
    return this.parseParenthesis();
  }

  private parseParenthesis() {
    if (this.peekToken() instanceof OpenParenthesis) {
      this.getNextToken();
      this.doNotExpect(this.peekToken(), CloseParenthesis, "parenthesis closed with no expression");
      const expression = this.expect(this.parseTerm(), Expression, "expecting expression after an open parenthesis");
      this.expect(this.getNextToken(), CloseParenthesis, "expecting to close this parenthesis");
      return new Parenthesis(expression);
    }
    return this.parseString();
  }

  private parseString() {
    if (this.peekToken() instanceof Quote) {
      this.getNextToken();
      let view = "";
      this.considerSpace();
      const terms = new Array<Expression>();
      while (this.hasMoreTokens()) {
        const token = this.peekToken();
        if (token instanceof Quote) break;
        if (token instanceof OpenBrace) {
          if (view) {
            terms.push(new String(view));
            view = "";
          }
          const interpolation = this.parseInterpolation();
          terms.push(interpolation);
          continue;
        }
        const character = this.getNextToken() as Character;
        view += character.view;
      }
      this.expect(this.getNextToken(), Quote, "expecting a closing quote for the string");
      this.ignoreSpace();
      if (view) terms.push(new String(view));
      if (terms.length > 1) return new Interpolation(terms);
      return new String(view);
    }
    return this.parseRange();
  }

  private parseInterpolation() {
    this.ignoreSpace();
    this.expect(this.getNextToken(), OpenBrace, "expecting '{' for string interpolation");
    const expression = this.parseTerm();
    this.expect(this.getNextToken(), CloseBrace, "expecting '}' for string interpolation");
    this.considerSpace();
    return expression;
  }

  private parseRange() {
    let left = this.parseCell();
    const parsableCell = left instanceof SpreadsheetCell || left instanceof Identifier || left instanceof Number;
    if (parsableCell) {
      this.considerSpace();
      if (this.peekToken() instanceof Colon) {
        this.getNextToken();
        if (!parsableCell) {
          this.throwError(`invalid left hand side for range expression`);
        }
        if (left instanceof Number) left = new SpreadsheetCell("", left.view);
        if (left instanceof Identifier) left = new SpreadsheetCell(left.view, "");
        this.trackPosition();
        let right = this.parseCell();
        this.doNotExpect(right, EOF, "oops! missing the right hand side for range expression");
        if (!(right instanceof SpreadsheetCell || right instanceof Identifier || right instanceof Number)) {
          this.throwError(`invalid right hand side for range expression`);
        }
        if (right instanceof Number) right = new SpreadsheetCell("", right.view);
        if (right instanceof Identifier) right = new SpreadsheetCell(right.view, "");
        this.untrackPosition();
        this.ignoreSpace();
        return new SpreadsheetRange(left, right);
      }
      this.ignoreSpace();
    }
    return left;
  }

  private parseCell() {
    const left = this.parseToken() as Identifier | Number;
    if (left instanceof Identifier) {
      this.considerSpace();
      if (this.peekToken() instanceof Number) {
        const right = this.parseToken() as Number;
        this.ignoreSpace();
        return new SpreadsheetCell(left.view, right.view);
      }
      this.ignoreSpace();
    }
    return left;
  }

  private parseToken() {
    const token = this.getNextToken();
    if (token instanceof BadToken) this.throwError(`bad input character \`${token.view}\` found`);
    return token;
  }
}