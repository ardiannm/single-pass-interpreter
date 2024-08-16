import { BoundKind } from "../analysis/binder/kind/bound.kind";
import { BoundCompilationUnit } from "../analysis/binder/bound.compilation.unit";
import { BoundBinaryOperatorKind } from "../analysis/binder/kind/bound.binary.operator.kind";
import { BoundUnaryOperatorKind } from "../analysis/binder/kind/bound.unary.operator.kind";
import { BoundBinaryExpression } from "../analysis/binder/binary.expression";
import { BoundNumericLiteral } from "../analysis/binder/bound.numeric.literal";
import { BoundUnaryExpression } from "../analysis/binder/bound.unary.expression";
import { BoundNode } from "../analysis/binder/bound.node";
import { DiagnosticsBag } from "../analysis/diagnostics/diagnostics.bag";
import { BoundBlock } from "../analysis/binder/bound.block";
import { BoundCellAssignment } from "../analysis/binder/bound.cell.assignment";
import { BoundCellReference } from "../analysis/binder/bound.cell.reference";
import { ColorPalette } from "../dev/color.palette";

export class Evaluator {
  private value = 0;
  private logging = false;
  constructor(private diagnostics: DiagnosticsBag) {}

  evaluate<Kind extends BoundNode>(node: Kind): number {
    type NodeType<T> = Kind & T;
    switch (node.kind) {
      case BoundKind.BoundCompilationUnit:
        return this.evaluateBoundCompilationUnit(node as NodeType<BoundCompilationUnit>);
      case BoundKind.BoundBlock:
        return this.evaluateBoundBlock(node as NodeType<BoundBlock>);
      case BoundKind.BoundCellAssignment:
        return this.evaluateBoundCellAssignment(node as NodeType<BoundCellAssignment>);
      case BoundKind.BoundBinaryExpression:
        return this.evaluateBoundBinaryExpression(node as NodeType<BoundBinaryExpression>);
      case BoundKind.BoundBinaryExpression:
        return this.evaluateBoundUnaryExpression(node as NodeType<BoundUnaryExpression>);
      case BoundKind.BoundCellReference:
        return this.evaluateBoundCellReference(node as NodeType<BoundCellReference>);
      case BoundKind.BoundNumericLiteral:
        return this.evaluateBoundNumericLiteral(node as NodeType<BoundNumericLiteral>);
      case BoundKind.BoundDefaultZero:
        return 0;
    }
    this.diagnostics.evaluatorMethod(node.kind, node.span);
    return 0;
  }

  private evaluateBoundCompilationUnit(node: BoundCompilationUnit): number {
    for (const statement of node.root) this.value = this.evaluate(statement);
    return this.value;
  }

  private evaluateBoundBlock(node: BoundBlock): number {
    for (const statement of node.statements) this.value = this.evaluate(statement);
  return this.value;
  }

  private evaluateBoundCellAssignment(node: BoundCellAssignment): number {
    node.reference.cell.evaluated = false;
    const value = this.evaluate(node.reference);
    // notify observers backtracking
    // execute final observers only (nashta duhet mi rujt kto mrena BoundCellAssignment)
    // console.log(node.span.line + "", node.reference.name, node.observers);
    console.log(node.span.line + "", node.triggers);
    return value;
  }

  private evaluateBoundCellReference(node: BoundCellReference): number {
    if (node.cell.evaluated) {
      const message = ColorPalette.terracotta(`Ln, ${node.span.line} >> ${node.name} = ${node.cell.value}`);
      if (this.logging) console.log(message);
      return node.cell.value;
    }
    node.cell.value = this.evaluate(node.expression);
    node.cell.evaluated = true;
    const message = ColorPalette.teal(`Ln, ${node.span.line} >> ${node.name} = ${node.cell.value}`);
    if (this.logging) console.log(message);
    return node.cell.value;
  }

  private evaluateBoundBinaryExpression(node: BoundBinaryExpression): number {
    const left = this.evaluate(node.left);
    const right = this.evaluate(node.right);
    switch (node.operatorKind) {
      case BoundBinaryOperatorKind.Addition:
        return left + right;
      case BoundBinaryOperatorKind.Subtraction:
        return left - right;
      case BoundBinaryOperatorKind.Multiplication:
        return left * right;
      case BoundBinaryOperatorKind.Division:
        return left / right;
      case BoundBinaryOperatorKind.Exponentiation:
        return left ** right;
    }
  }

  private evaluateBoundUnaryExpression(node: BoundUnaryExpression): number {
    const right = this.evaluate(node.right);
    switch (node.operatorKind) {
      case BoundUnaryOperatorKind.Identity:
        return right;
      case BoundUnaryOperatorKind.Negation:
        return -right;
    }
  }

  private evaluateBoundNumericLiteral(node: BoundNumericLiteral) {
    return node.value;
  }
}