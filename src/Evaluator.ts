import { SyntaxKind } from "./Syntax/SyntaxKind";
import { BinaryExpression, PrimaryExpression, SyntaxNode, SyntaxTree, UnaryExpression } from "./Syntax/SyntaxNode";

export class Evaluator {
  constructor() {}

  Evaluate<T extends SyntaxNode>(node: T): number {
    try {
      if (node instanceof SyntaxTree) {
        return this.SyntaxTree(node);
      } else if (node instanceof PrimaryExpression) {
        return this.PrimaryExpression(node);
      } else if (node instanceof UnaryExpression) {
        return this.UnaryExpression(node);
      } else if (node instanceof BinaryExpression) {
        return this.BinaryExpression(node);
      }
      throw `Evaluator: '${node.Kind}' is not implemented`;
    } catch (error) {
      return error;
    }
  }

  private SyntaxTree(node: SyntaxTree): number {
    return this.Evaluate(node.Tree);
  }

  private PrimaryExpression(node: PrimaryExpression): number {
    switch (node.Kind) {
      case SyntaxKind.NumberExpression:
        return parseFloat(node.Text);
      default:
        throw `Evaluator: '${node.Kind}' is not implemented in primary expressions`;
    }
  }

  private BinaryExpression(node: BinaryExpression): number {
    const left = this.Evaluate(node.Left);
    const right = this.Evaluate(node.Right);
    switch (node.Operator.Kind) {
      case SyntaxKind.PlusToken:
        return left + right;
      case SyntaxKind.MinusToken:
        return left - right;
      case SyntaxKind.StarToken:
        return left * right;
      case SyntaxKind.SlashToken:
        return left / right;
      default:
        throw `Evaluator: Operation '${node.Operator}' is not implemented`;
    }
  }

  private UnaryExpression(node: UnaryExpression): number {
    const right = this.Evaluate(node.Right);
    switch (node.Operator.Kind) {
      case SyntaxKind.PlusToken:
        return +right;
      case SyntaxKind.MinusToken:
        return -right;
      default:
        throw `Evaluator: Operation '${node.Operator}' is not implemented`;
    }
  }
}
