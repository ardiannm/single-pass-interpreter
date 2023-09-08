import Program from "./ast/expressions/Program";
import Expression from "./ast/expressions/Expression";
import Slash from "./ast/operators/Slash";
import Power from "./ast/operators/Power";
import Identifier from "./ast/expressions/Identifier";
import GreaterThan from "./ast/tokens/GreaterThan";
import BackSlash from "./ast/tokens/BackSlash";
import StandaloneComponent from "./ast/html/StandaloneComponent";
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
import Script from "./ast/html/Script";
import HTMLElement from "./ast/html/HTMLElement";
import Component from "./ast/html/Component";
import Service from "./services/Service";
import ExclamationMark from "./ast/tokens/ExclamationMark";
import Comment from "./ast/html/Comment";
import TextContent from "./ast/html/TextContent";
import Number from "./ast/expressions/Number";
import Interpolation from "./ast/expressions/Interpolation";
import Inject from "./services/Inject";
import OpenBrace from "./ast/tokens/OpenBrace";
import CloseBrace from "./ast/tokens/CloseBrace";
import SpreadsheetCell from "./ast/spreadsheet/SpreadsheetCell";
import Colon from "./ast/tokens/Colon";
import SpreadsheetRange from "./ast/spreadsheet/SpreadsheetRange";
import Literal from "./ast/expressions/Literal";
import Space from "./ast/tokens/Space";

const AmbiguosTags = ["link", "br", "input", "img", "hr", "meta", "col", "textarea"];

export default class Parser extends Service {
  public parse() {
    return this.parseProgram();
  }

  @Inject
  private parseProgram() {
    this.doNotExpect(this.peekToken(), EOF, "source file is empty");
    const expressions = new Array<Expression>();
    while (this.hasMoreTokens()) {
      const right = this.parseExpressions();
      this.expect(right, Expression, `token type \`${right.type}\` found in the program is not a valid expression`);
      expressions.push(right);
    }
    return new Program(expressions);
  }

  @Inject
  private parseExpressions(): Expression {
    if ((this.peekToken() as Identifier).view === "spreadsheet") {
      this.getNextToken();
      return this.parseRange();
    }
    if (this.peekToken() instanceof LessThan) return this.parseComponent();
    return this.parseTerm();
  }

  @Inject
  private parseComponent() {
    const left = this.parseContent();
    if (left instanceof OpenTag) {
      const children = new Array<Component>();
      while (this.hasMoreTokens()) {
        const right = this.parseComponent();
        if (right instanceof CloseTag) {
          if (right.tag !== left.tag) {
            this.throwError(`unmatching \`${right.tag}\` found for the \`${left.tag}\` tag`);
          }
          return new HTMLElement(left.tag, children);
        }
        const component = this.expect(right, Component, "token is not a valid html component");
        children.push(component);
      }
      this.throwError(`expecting a closing token for \`${left.tag}\` tag`);
    }
    return left;
  }

  @Inject
  private parseContent() {
    let view = "";
    this.considerSpace();
    if (this.peekToken() instanceof LessThan) {
      this.ignoreSpace();
      return this.parseScript();
    }
    while (this.hasMoreTokens()) {
      if (this.peekToken() instanceof LessThan) break;
      view += this.getNext();
    }
    this.ignoreSpace();
    // if (/^\s+$/.test(view)) {
    //   return this.parseContent();
    // }
    return new TextContent(view);
  }

  @Inject
  private parseScript() {
    const left = this.parseTag();
    if (left instanceof OpenScriptTag) {
      const content = this.parseContent();
      try {
        const right = this.parseTag();
        if (!(right instanceof CloseScriptTag)) throw right;
        return new Script(content.view);
      } catch (right) {
        this.throwError(`expecting a closing \`script\` tag`);
      }
    }
    return left;
  }

  @Inject
  private parseTag() {
    const left = this.parseComment();
    if (left instanceof Comment) return left;
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
      this.expect(this.getNextToken(), GreaterThan, `expecting closing token \`>\` but received \`${token.view}\` after tag name identifier \`${identifier.view}\``);
      return new StandaloneComponent(identifier.view, attributes);
    }
    this.expect(this.getNextToken(), GreaterThan, "expecting `>` for tag");
    if (identifier.view === "script") return new OpenScriptTag();
    if (AmbiguosTags.includes(identifier.view)) return new StandaloneComponent(identifier.view, attributes);
    return new OpenTag(identifier.view, attributes);
  }

  @Inject
  private parseComment() {
    const left = this.expect(this.getNextToken(), LessThan, "expecting `<` for an html tag");
    if (this.peekToken() instanceof ExclamationMark) {
      this.expect(this.getNextToken(), ExclamationMark, "expecting `!` for a comment");
      const message = "expecting `--` after `!` for a comment";
      this.expect(this.getNextToken(), Minus, message);
      this.expect(this.getNextToken(), Minus, message);
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
            return new Comment(view);
          }
          this.pointer = keep;
        }
        view += this.getNext();
      }
      this.throwError("unexpected end of comment");
    }
    return left;
  }

  @Inject
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

  @Inject
  private parseAttribute() {
    const identifier = this.getNextToken() as Identifier;
    let view = "";
    if (this.peekToken() instanceof Equals) {
      this.getNextToken();
      view = this.expect(this.parseString(), String, "expecting a string value after `=` following a tag property").view;
    }
    return new Attribute(identifier.view, view);
  }

  @Inject
  private parseTerm() {
    const left = this.parseFactor();
    if (this.peekToken() instanceof Plus) {
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      const right = this.expect(this.parseTerm(), Expression, "invalid right hand side in binary expression");
      return new Addition(left, right);
    }
    if (this.peekToken() instanceof Minus) {
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      const right = this.expect(this.parseTerm(), Expression, "invalid right hand side in binary expression");
      return new Substraction(left, right);
    }
    return left;
  }

  @Inject
  private parseFactor() {
    const left = this.parseExponent();
    if (this.peekToken() instanceof Product) {
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      const right = this.expect(this.parseFactor(), Expression, "invalid right hand side in binary expression");
      return new Multiplication(left, right);
    }
    if (this.peekToken() instanceof Slash) {
      this.expect(left, Expression, "invalid left hand side in binary expression");
      this.getNextToken();
      this.doNotExpect(this.peekToken(), EOF, "unexpected end of binary expression");
      const right = this.expect(this.parseFactor(), Expression, "invalid right hand side in binary expression");
      return new Division(left, right);
    }
    return left;
  }

  @Inject
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

  @Inject
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

  @Inject
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

  @Inject
  private parseString() {
    if (this.peekToken() instanceof Quote) {
      this.getNextToken();
      let view = "";
      this.considerSpace();
      const terms = new Array<Expression>();
      while (this.hasMoreTokens()) {
        const token = this.peekToken();
        if (token instanceof Quote) break;
        if (token instanceof BackSlash) this.getNextToken();
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
      if (terms.length == 1) return new String(view);
      return new Interpolation(terms);
    }
    return this.getNextToken();
  }

  @Inject
  private parseInterpolation() {
    this.ignoreSpace();
    this.expect(this.getNextToken(), OpenBrace, "expecting '{' for string interpolation");
    const expression = this.parseTerm();
    this.expect(this.getNextToken(), CloseBrace, "expecting '}' for string interpolation");
    this.considerSpace();
    return expression;
  }

  @Inject
  private parseRange() {
    let left = this.parseCell();
    if (left instanceof SpreadsheetCell || left instanceof Identifier || left instanceof Number) {
      this.considerSpace();
      if (this.peekToken() instanceof Colon) {
        if (!(left instanceof SpreadsheetCell || left instanceof Identifier || left instanceof Number)) {
          this.throwError(`invalid left hand side for range expression`);
        }
        if (left instanceof Number) left = new SpreadsheetCell("", left.view);
        if (left instanceof Identifier) left = new SpreadsheetCell(left.view, "");
        this.getNextToken();
        let right = this.parseCell();
        this.doNotExpect(right, EOF, "oops! missing the right hand side for range expression");
        if (!(right instanceof SpreadsheetCell || right instanceof Identifier || right instanceof Number)) {
          this.throwError(`invalid right hand side for range expression`);
        }
        if (right instanceof Number) right = new SpreadsheetCell("", right.view);
        if (right instanceof Identifier) right = new SpreadsheetCell(right.view, "");
        this.ignoreSpace();
        return new SpreadsheetRange(left, right);
      }
      this.ignoreSpace();
    }
    return left;
  }

  @Inject
  private parseCell() {
    const left = this.getNextToken() as Identifier | Number;
    if (left instanceof Identifier) {
      this.considerSpace();
      if (this.peekToken() instanceof Number) {
        const right = this.getNextToken() as Number;
        this.ignoreSpace();
        return new SpreadsheetCell(left.view, right.view);
      }
      this.ignoreSpace();
    }
    return left;
  }
}
