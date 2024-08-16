import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxToken } from "./syntax.token";
import { SyntaxStatement } from "./sytax.statements";
import { SyntaxTree } from "../../runtime/syntax.tree";
import { SyntaxNode } from "./syntax.node";

export class SyntaxBlock extends SyntaxNode {
  constructor(
    protected override tree: SyntaxTree,
    public openBrace: SyntaxToken<SyntaxNodeKind.OpenBraceToken>,
    public statements: Array<SyntaxStatement>,
    public closeBrace: SyntaxToken<SyntaxNodeKind.CloseBraceToken>
  ) {
    super(tree, SyntaxNodeKind.SyntaxBlock);
  }
}