import Lexer from "./Lexer";
import Program from "./Program";
import Expression from "./Expression";
import Newline from "./Newline";
import LessThan from "./LessThan";
import Division from "./Division";
import Exponentiation from "./Exponentiation";
import Identifier from "./Identifier";
import GreaterThan from "./GreaterThan";
import UniTag from "./UinTag";
import Operator from "./Operator";
import Equals from "./Equals";
import Substraction from "./Substraction";
import EOF from "./EOF";
import OpenTag from "./OpenTag";
import Property from "./Property";
import Addition from "./Addition";
import Multiplication from "./Multiplication";
import OpenParenthesis from "./OpenParenthesis";
import CloseParenthesis from "./CloseParenthesis";
import Character from "./Character";
import Quote from "./Quote";
import Token from "./Token";
import Binary from "./Binary";
import Unary from "./Unary";
import ParseError from "./ParseError";
import String from "./String";
import Parenthesis from "./Parenthesis";
import CloseTag from "./CloseTag";
import generateId from "./GenerateId";

// deno-lint-ignore no-explicit-any
export type Constructor<Class> = new (...args: any[]) => Class;

export default class Parser extends Lexer {
  //

  public parse() {
    return this.parseProgram();
  }

  @generateId
  private parseProgram() {
    try {
      this.doNotExpect(this.peekToken(), EOF, "Program can't be blank");
      const expressions = new Array<Expression>();
      while (this.hasMoreTokens()) {
        expressions.push(this.parseHTML());
        if (this.peekToken() instanceof Newline) this.getNextToken();
      }
      const program = new Program(expressions);
      return program;
    } catch (report) {
      return report;
    }
  }

  private parseHTML() {
    if (this.peekToken() instanceof LessThan) {
      return this.parseTag();
    }
    return this.expect(this.parseMath(), Binary, "Math expression or HTML content expected in the program");
  }

  private parseTag() {
    this.expect(this.getNextToken(), LessThan, "Expecting a open '<' token");
    const message = "Expecting a closing '>' token for this tag";
    if (this.peekToken() instanceof Division) {
      this.getNextToken();
      const identifier = this.expect(this.getNextToken(), Identifier, "Expecting identifier for this closing tag");
      this.expect(this.getNextToken(), GreaterThan, message);
      return new CloseTag(identifier);
    }
    const identifier = this.expect(this.getNextToken(), Identifier, "Expecting identifier for this open tag");
    const properties = this.parseProperties();
    if (this.peekToken() instanceof Division) {
      this.getNextToken();
      this.expect(this.getNextToken(), GreaterThan, message);
      return new UniTag(identifier, properties);
    }
    this.expect(this.getNextToken(), GreaterThan, message);
    return new OpenTag(identifier, properties);
  }

  private parseProperties() {
    const props = new Array<Property>();
    while (this.peekToken() instanceof Identifier) {
      const identifier = this.getNextToken() as Identifier;
      let view = "";
      if (this.peekToken() instanceof Equals) {
        this.getNextToken();
        view = this.expect(this.parseString(), String, "Expecting a string value after '=' token following a tag property").view;
      }
      props.push(new Property(identifier, view));
    }
    return props;
  }

  private parseMath() {
    return this.parseAddition();
  }

  private parseAddition() {
    let left = this.parseMultiplication();
    while (this.peekToken() instanceof Addition || this.peekToken() instanceof Substraction) {
      this.expect(left, Expression, `Invalid left hand side in ${this.peekToken().name} expression`);
      const operator = this.getNextToken() as Operator;
      this.doNotExpect(this.peekToken(), EOF, `Unexpected ending of ${operator.name} expression`);
      const right = this.expect(this.parseMultiplication(), Expression, `Invalid right hand side in ${operator.name} expression`);
      left = new Binary(left, operator, right);
    }
    return left;
  }

  private parseMultiplication() {
    let left = this.parsePower();
    while (this.peekToken() instanceof Multiplication || this.peekToken() instanceof Division) {
      const operator = this.getNextToken() as Operator;
      this.expect(left, Expression, `Invalid left hand side in ${operator.name} expression`);
      this.doNotExpect(this.peekToken(), EOF, `Unexpected ending of ${operator.name} expression`);
      const right = this.expect(this.parsePower(), Expression, `Invalid right hand side in ${operator.name} expression`);
      left = new Binary(left, operator, right);
    }
    return left;
  }

  private parsePower() {
    let left = this.parseUnary();
    if (this.peekToken() instanceof Exponentiation) {
      const operator = this.getNextToken() as Operator;
      this.expect(left, Expression, `Invalid left hand side in ${operator.name} expression`);
      this.doNotExpect(this.peekToken(), EOF, `Unexpected ending of ${operator.name} expression`);
      const right = this.expect(this.parsePower(), Expression, `Invalid right hand side in ${operator.name} expression`);
      left = new Binary(left, operator, right);
    }
    return left;
  }

  private parseUnary(): Expression {
    if (this.peekToken() instanceof Addition || this.peekToken() instanceof Substraction) {
      const operator = this.getNextToken() as Operator;
      this.doNotExpect(this.peekToken(), EOF, `Unexpected ending of ${operator.name} expression`);
      const right = this.expect(this.parseUnary(), Expression, `Invalid expression in ${operator.name} expression`);
      return new Unary(operator, right);
    }
    return this.parseParanthesis();
  }

  private parseParanthesis() {
    if (this.peekToken() instanceof OpenParenthesis) {
      this.getNextToken();
      this.doNotExpect(this.peekToken(), CloseParenthesis, "Parenthesis closed with no expression");
      const expression = this.expect(this.parseAddition(), Expression, "Expecting expression after an open parenthesis");
      this.expect(this.getNextToken(), CloseParenthesis, "Expecting to close this parenthesis");
      return new Parenthesis(expression);
    }
    return this.parseString();
  }

  private parseString() {
    if (this.peekToken() instanceof Quote) {
      this.getNextToken() as Quote;
      let view = "";
      this.keepSpace();
      while (this.hasMoreTokens()) {
        if (this.peekToken() instanceof Quote) break;
        view += (this.getNextToken() as Character).view;
      }
      this.expect(this.getNextToken(), Quote, "Expecting a closing quote for the string");
      this.ignoreSpace();
      return new String(view);
    }
    return this.getNextToken();
  }

  private assert<T extends Token>(instance: Token, constructor: Constructor<T>): boolean {
    return instance instanceof constructor;
  }

  private expect<T extends Token>(token: Token, tokenConstructor: Constructor<T>, message: string): T {
    if (this.assert(token, tokenConstructor)) return token as T;
    const error = new ParseError(message);
    this.report(error);
    throw error;
  }

  private doNotExpect<T extends Token>(token: Token, tokenConstructor: Constructor<T>, message: string): T {
    if (this.assert(token, tokenConstructor)) {
      const error = new ParseError(message);
      this.report(error);
      throw error;
    }
    return token as T;
  }
}
