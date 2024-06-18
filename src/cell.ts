import { BoundExpression } from "./analysis/binder/expression";
import { BoundKind } from "./analysis/binder/kind/bound.kind";
import { BoundNode } from "./analysis/binder/bound.node";

export class Cell extends BoundNode {
  constructor(
    public override kind: BoundKind.Cell,
    public name: string,
    public declared: boolean,
    public value: number,
    public expression: BoundExpression,
    public dependencies: Map<string, Cell>,
    public subscribers: Map<string, Cell>,
    public formula: string,
    public row: number,
    public column: number
  ) {
    super(kind);
  }

  track(dependency: Cell) {
    this.dependencies.set(dependency.name, dependency);
    dependency.subscribers.set(this.name, this);
  }

  contains(dependency: Cell, visited = new Set()) {
    if (visited.has(this)) return false;
    visited.add(this);
    if (this.dependencies.has(dependency.name)) return true;
    for (const dep of this.dependencies.values()) if (dep.contains(dependency, visited)) return true;
    return false;
  }

  clearDependencies() {
    this.dependencies.forEach((dependency) => dependency.subscribers.delete(this.name));
    this.dependencies.clear();
  }

  static columnIndexToLetter(column: number): string {
    let name = "";
    while (column > 0) {
      const remainder = (column - 1) % 26;
      name = String.fromCharCode(65 + remainder) + name;
      column = Math.floor((column - 1) / 26);
    }
    return name;
  }

  static letterToColumnIndex(letter: string): number {
    let result = 0;
    for (let index = 0; index < letter.length; index++) {
      const charCode = letter.charCodeAt(index) - 65 + 1;
      result = result * 26 + charCode;
    }
    return result;
  }

  static fromIndex(row: number, column: number) {
    return this.columnIndexToLetter(column) + row;
  }
}
