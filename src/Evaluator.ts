import { Cell } from "./Cell";
import { DiagnosticBag } from "./Diagnostics/DiagnosticBag";
import { BoundKind } from "./CodeAnalysis/Binding/Kind/BoundKind";
import { BoundProgram } from "./CodeAnalysis/Binding/BoundProgram";
import { BoundBinaryOperatorKind } from "./CodeAnalysis/Binding/Kind/BoundBinaryOperatorKind";
import { BoundUnaryOperatorKind } from "./CodeAnalysis/Binding/Kind/BoundUnaryOperatorKind";
import { BoundBinaryExpression } from "./CodeAnalysis/Binding/BoundBinaryExpression";
import { BoundNumericLiteral } from "./CodeAnalysis/Binding/BoundNumericLiteral";
import { BoundCellAssignment } from "./CodeAnalysis/Binding/BoundCellAssignment";
import { BoundUnaryExpression } from "./CodeAnalysis/Binding/BoundUnaryExpression";
import { BoundNode } from "./CodeAnalysis/Binding/BoundNode";
import { ColorPalette } from "./View/ColorPalette";

export class Evaluator {
  private Value = 0;
  private Evaluated = new Set<string>();
  private Edges = new Set<Cell>();
  private Notified = new Set<string>();
  constructor(private Diagnostics: DiagnosticBag) {}

  Evaluate<Kind extends BoundNode>(Node: Kind): number {
    type NodeType<T> = Kind & T;
    switch (Node.Kind) {
      case BoundKind.Program:
        return this.EvaluateProgram(Node as NodeType<BoundProgram>);
      case BoundKind.CellAssignment:
        return this.EvaluateCellAssignment(Node as NodeType<BoundCellAssignment>);
      case BoundKind.BinaryExpression:
        return this.EvaluateBinaryExpression(Node as NodeType<BoundBinaryExpression>);
      case BoundKind.UnaryExpression:
        return this.EvaluateUnaryExpression(Node as NodeType<BoundUnaryExpression>);
      case BoundKind.Cell:
        return this.EvaluateCell(Node as NodeType<Cell>);
      case BoundKind.NumericLiteral:
        return this.EvaluateNumericLiteral(Node as NodeType<BoundNumericLiteral>);
    }
    this.Diagnostics.EvaluatorMethod(Node.Kind);
    return 0;
  }

  private EvaluateProgram(Node: BoundProgram): number {
    for (const Root of Node.Root) this.Value = this.Evaluate(Root);
    return this.Value;
  }

  private EvaluateCellAssignment(Node: BoundCellAssignment): number {
    const Value = this.Evaluate(Node.Cell.Expression);
    if (Node.Cell.Value !== Value) {
      Node.Cell.Value = Value;
      this.Edges.clear();
      this.Notified.clear();
      this.NotifyForChange(Node.Cell);
      this.Evaluated.add(Node.Cell.Name); // make sure to add back this name before executing edges because we have already evaluated this node manually
      this.Edges.forEach((Edge) => this.EvaluateCell(Edge));
    }
    return Node.Cell.Value;
  }

  private NotifyForChange(Node: Cell) {
    this.Notified.add(Node.Name);
    this.Evaluated.delete(Node.Name);
    if (Node.Subscribers.size) Node.Subscribers.forEach((Sub) => !this.Notified.has(Sub.Name) && this.NotifyForChange(Sub));
    else this.Edges.add(Node);
  }

  private EvaluateCell(Node: Cell) {
    if (this.Evaluated.has(Node.Name)) {
      console.log(ColorPalette.Moss(Node.Name + " cached " + Node.Formula));
    } else {
      console.log(ColorPalette.Terracotta(Node.Name + " processed"));
      Node.Value = this.Evaluate(Node.Expression);
      this.Evaluated.add(Node.Name);
      this.Edges.delete(Node);
    }
    return Node.Value;
  }

  private EvaluateBinaryExpression(Node: BoundBinaryExpression): number {
    const Left = this.Evaluate(Node.Left);
    const Right = this.Evaluate(Node.Right);
    switch (Node.OperatorKind) {
      case BoundBinaryOperatorKind.Addition:
        return Left + Right;
      case BoundBinaryOperatorKind.Subtraction:
        return Left - Right;
      case BoundBinaryOperatorKind.Multiplication:
        return Left * Right;
      case BoundBinaryOperatorKind.Division:
        return Left / Right;
      case BoundBinaryOperatorKind.Exponentiation:
        return Left ** Right;
    }
  }

  private EvaluateUnaryExpression(Node: BoundUnaryExpression): number {
    const Right = this.Evaluate(Node.Right);
    switch (Node.OperatorKind) {
      case BoundUnaryOperatorKind.Identity:
        return Right;
      case BoundUnaryOperatorKind.Negation:
        return -Right;
    }
  }

  private EvaluateNumericLiteral(Node: BoundNumericLiteral) {
    return Node.Value;
  }
}
