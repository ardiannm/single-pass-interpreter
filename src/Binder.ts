import { Diagnostics } from "./CodeAnalysis/Diagnostics/Diagnostics";
import { SyntaxKind } from "./CodeAnalysis/SyntaxKind";
import { CellReference, SyntaxNode, SyntaxTree } from "./CodeAnalysis/SyntaxNode";
import { SyntaxToken } from "./CodeAnalysis/SyntaxToken";

export class Binder {
  constructor(public Report: Diagnostics) {}

  private DeclarationsStack = new Set<string>();

  Bind<Structure extends SyntaxNode>(Node: Structure) {
    switch (Node.Kind) {
      case SyntaxKind.SyntaxTree:
        return this.BindSyntaxTree(Node as Structure & SyntaxTree);
      case SyntaxKind.NumberToken:
        return this.BindNumberExpression(Node as Structure & SyntaxToken);
      case SyntaxKind.CellReference:
        return this.BindCellReference(Node as Structure & CellReference);
      default:
        this.Report.MissingBindingMethod(Node.Kind);
    }
  }
  private BindCellReference(Node: CellReference) {
    const Reference = Node.Left.Text + Node.Right.Text;
    this.DeclarationsStack.add(Reference);
    return new BoundCellReference(Binding.BoundCellReference, Reference);
  }

  private BindSyntaxTree(Node: SyntaxTree) {
    return new BoundSyntaxTree(Binding.BoundSyntaxTree, this.Bind(Node.Root));
  }

  private BindNumberExpression(Node: SyntaxToken) {
    const Value = parseFloat(Node.Text);
    return new BoundNumberExpression(Binding.BoundNumberExpression, Value);
  }
}

enum Binding {
  BoundSyntaxTree = "BoundSyntaxTree",
  BoundNumberExpression = "BoundNumberExpression",
  BoundCellReference = "BoundCellReference",
}

class BoundNode {
  constructor(public Kind: Binding) {}
}

class BoundSyntaxTree extends BoundNode {
  constructor(public Kind: Binding, public Root: BoundExpression) {
    super(Kind);
  }
}

class BoundExpression extends BoundNode {}

class BoundNumberExpression extends BoundExpression {
  constructor(public Kind: Binding, public Value: number) {
    super(Kind);
  }
}

class BoundCellReference extends BoundExpression {
  constructor(public Kind: Binding, public Reference: string) {
    super(Kind);
  }
}
