import { DiagnosticBag } from "../../Diagnostics/DiagnosticBag";
import { BoundKind } from "./Kind/BoundKind";
import { Cell } from "../../Cell";
import { BoundNumericLiteral } from "./BoundNumericLiteral";
import { CompilerOptions } from "../../CompilerOptions";
import { Services } from "../../Services";
import { ColorPalette } from "../../View/ColorPalette";

export class BoundScope {
  Cells = new Map<string, Cell>();
  DeclarationSubscribers = new Set<(Cell: Cell) => void>();
  EvaluationSubscribers = new Set<(Cell: Cell) => void>();

  constructor(public ParentScope: BoundScope | null, public Configuration: CompilerOptions) {}

  ConstructCell(Name: string, Row: string, Column: string) {
    const Scope = this.ResolveScopeForCell(Name);
    let Data: Cell;
    if (Scope) {
      Data = Scope.Cells.get(Name) as Cell;
    } else {
      const Expression = new BoundNumericLiteral(BoundKind.NumericLiteral, 0);
      Data = new Cell(BoundKind.Cell, Name, false, 0, Expression, new Map<string, Cell>(), new Map<string, Cell>(), "0", parseFloat(Row), Services.LetterToColumnIndex(Column));
    }
    this.Cells.set(Name, Data);
    return Data;
  }

  private ResolveScopeForCell(Name: string): BoundScope | null {
    if (this.Cells.has(Name)) {
      return this;
    }
    if (this.ParentScope) {
      return this.ParentScope.ResolveScopeForCell(Name);
    }
    return null;
  }

  CheckDeclarations(Diagnostics: DiagnosticBag) {
    this.Cells.forEach((Cell) => {
      if (!Cell.Declared) {
        Diagnostics.UndeclaredCell(Cell.Name);
      }
      Cell.Dependencies.forEach((Dependency) => {
        if (!Dependency.Declared) {
          Diagnostics.UndeclaredCell(Dependency.Name);
        }
      });
      if (Cell.Contains(Cell)) Diagnostics.CircularDependency(Cell);
    });
  }

  Move(Dependency: Cell) {
    if (this.ParentScope) {
      this.ParentScope.Cells.set(Dependency.Name, Dependency);
      this.Cells.delete(Dependency.Name);
      return true;
    }
    return false;
  }

  ClearUndeclared() {
    this.Cells.forEach((Cell) => {
      if (!Cell.Declared) {
        this.Cells.delete(Cell.Name);
      }
      Cell.Dependencies.forEach((Dependency) => {
        if (!Dependency.Declared) {
          this.Cells.delete(Dependency.Name);
        }
      });
    });
  }

  SubscribeToDeclarationEvent(Fn: (Cell: Cell) => void) {
    this.DeclarationSubscribers.add(Fn);
  }

  SubscribeToEvaluationEvent(Fn: (cell: Cell) => void) {
    this.EvaluationSubscribers.add(Fn);
  }

  EmitDeclarationEventForCell(Node: Cell) {
    if (this.Configuration.Settings.DevMode) console.log(ColorPalette.Teal(`Configuration.Settings.EmitDeclarationEvent "${Node.Name}"`));
    for (const Sub of this.EvaluationSubscribers) Sub(Node);
  }

  EmitEvaluationEventForCell(Node: Cell) {
    if (this.Configuration.Settings.DevMode) console.log(ColorPalette.Teal(`Configuration.Settings.EmitEvaluationEvent "${Node.Name}=${Node.Value}"`));
    for (const Sub of this.EvaluationSubscribers) Sub(Node);
  }
}
