import { SyntaxKind } from "./SyntaxKind";
import { SyntaxNode } from "./SyntaxNode";

export class SyntaxToken extends SyntaxNode {
  constructor(public Kind: SyntaxKind, public Text: string) {
    super(Kind);
  }
}
