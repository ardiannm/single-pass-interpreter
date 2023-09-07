import System from "./system/System";
import InterpreterException from "./services/InterpreterException";
import Binary from "./ast/expressions/Binary";
import Program from "./ast/expressions/Program";
import Unary from "./ast/expressions/Unary";
import Token from "./ast/tokens/Token";
import SystemNumber from "./system/SystemNumber";
import SystemString from "./system/SystemString";
import Substraction from "./ast/expressions/Substraction";
import Multiplication from "./ast/expressions/Multiplication";
import Division from "./ast/expressions/Division";
import Number from "./ast/expressions/Number";
import Exponentiation from "./ast/expressions/Exponentiation";
import Negation from "./ast/expressions/Negation";
import String from "./ast/expressions/String";
import Interpolation from "./ast/expressions/Interpolation";

export default class Interpreter {
  evaluate<T extends Token>(token: T): System {
    if (token instanceof Program) return this.evaluateProgram(token);
    if (token instanceof Binary) return this.evaluateBinary(token);
    if (token instanceof Number) return this.evaluateNumber(token);
    if (token instanceof Unary) return this.evaluateUnary(token);
    if (token instanceof String) return this.evaluateString(token);
    if (token instanceof Interpolation) return this.evaluateInterpolation(token);

    throw new InterpreterException(`token type \`${token.type}\` has not been implemented for interpretation`);
  }

  private evaluateProgram(token: Program) {
    let value = new System();
    token.expressions.forEach((e) => (value = this.evaluate(e)));
    return value;
  }

  private evaluateNumber(token: Number) {
    return new SystemNumber(parseFloat(token.view));
  }

  private evaluateBinary(token: Binary) {
    const left = this.evaluate(token.left);
    const right = this.evaluate(token.right);

    if (!(left instanceof SystemNumber) || !(right instanceof SystemNumber)) {
      return new InterpreterException(`can't perform binary operations between \`${token.left.type}\` and "${token.right.type}" tokens`);
    }

    switch (true) {
      case token instanceof Substraction:
        return new SystemNumber(left.value - right.value);
      case token instanceof Multiplication:
        return new SystemNumber(left.value * right.value);
      case token instanceof Division:
        return new SystemNumber(left.value / right.value);
      case token instanceof Exponentiation:
        return new SystemNumber(left.value ** right.value);
      default:
        return new SystemNumber(left.value + right.value);
    }
  }

  private evaluateUnary(token: Unary) {
    const right = this.evaluate(token.right);

    if (!(right instanceof SystemNumber)) {
      return new InterpreterException(`can't perform unary operation over "${token.right.type}" token`);
    }

    switch (true) {
      case token instanceof Negation:
        return new SystemNumber(-right.value);
      default:
        return new SystemNumber(+right.value);
    }
  }

  private evaluateString(token: String) {
    return new SystemString(token.view);
  }

  private evaluateInterpolation(token: Interpolation) {
    let string = "";
    token.strings.forEach((token) => {
      const runtime = this.evaluate(token);
      if (runtime instanceof SystemNumber) {
        string += runtime.value.toString();
      } else if (runtime instanceof SystemString) {
        string += runtime.value;
      }
    });
    return new SystemString(string);
  }
}
