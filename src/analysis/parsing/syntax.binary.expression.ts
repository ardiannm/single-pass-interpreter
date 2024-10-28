import { SyntaxTree } from "../../syntax.tree";
import { SyntaxBinaryOperatorKind } from "./kind/syntax.binary.operator.kind";
import { SyntaxKind } from "./kind/syntax.kind";
import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxExpression } from "./syntax.expression";
import { SyntaxNode } from "./syntax.node";
import { SyntaxToken } from "./syntax.token";

export class SyntaxBinaryExpression extends SyntaxExpression {
  constructor(public override tree: SyntaxTree, public left: SyntaxNode, public operator: SyntaxToken<SyntaxBinaryOperatorKind>, public right: SyntaxNode) {
    super(tree, SyntaxNodeKind.BinaryExpression);
  }

  override getFirstChild(): SyntaxToken<SyntaxKind> {
    return this.left.getFirstChild();
  }
  override getLastChild(): SyntaxToken<SyntaxKind> {
    return this.right.getLastChild();
  }
}