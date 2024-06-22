import { BoundExpression } from "./expression";
import { BoundKind } from "./kind/bound.kind";
import { BoundBinaryOperatorKind } from "./kind/binary.operator.kind";

export class BoundBinaryExpression extends BoundExpression {
  constructor(public left: BoundExpression, public operatorKind: BoundBinaryOperatorKind, public right: BoundExpression) {
    super(BoundKind.BinaryExpression);
  }
}