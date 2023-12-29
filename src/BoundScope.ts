import { Cell } from "./Cell";
import { BoundCellAssignment } from "./CodeAnalysis/Binder/BoundCellAssignment";
import { DiagnosticBag } from "./DiagnosticBag";
import { DiagnosticPhase } from "./DiagnosticPhase";
import { RgbColor } from "./Interpreter/RgbColor";

export class BoundScope {
  private Data = new Map<string, Cell>();
  public readonly Names = new Set<string>();

  constructor(public Diagnostics: DiagnosticBag, public ParentScope?: BoundScope) {}

  public RegisterCell(Name: string) {
    this.Names.add(Name);
  }

  private ResolveScopeForCell(Name: string): BoundScope | undefined {
    if (this.Data.has(Name)) return this;
    if (this.ParentScope) return this.ResolveScopeForCell(Name);
    return undefined;
  }

  public Assert(Name: string) {
    const Data = this.GetCell(Name);
    if (Data) return Data;
    this.Diagnostics.ReportUndefinedCell(DiagnosticPhase.Binder, Name);
    return undefined;
  }

  private GetCell(Name: string) {
    const Env = this.ResolveScopeForCell(Name);
    if (Env) return Env.Data.get(Name) as Cell;
    return undefined;
  }

  public SetValueForCell(Name: string, Value: number) {
    const Data = this.GetCell(Name);
    if (Data) {
      const Diff = Value - Data.Value;
      var Text = Name + " -> " + Value;
      if (Diff !== 0) {
        Text += " (";
        if (Diff > 0) Text += "+";
        else if (Diff < 0) Text += "-";
        Text += Math.abs(Diff) + ")";
      }
      const View = RgbColor.Teal(Text);
      console.log(View);
      Data.Value = Value;
    }
  }

  public DefineCell(Node: BoundCellAssignment) {
    for (const Subject of Node.Subjects) {
      this.Assert(Subject);
    }
    const Data = this.GetCell(Node.Name);
    if (Data === undefined) {
      const Data = new Cell(Node.Name, 0, Node.Expression, Node.Subjects, new Set<string>());
      this.Data.set(Node.Name, Data);
      for (const Subject of Data.Subjects) this.GetCell(Subject)?.Notify(Node.Name);
      this.GetSubjects(Data.Name, Data);
      return Data;
    }
    for (const Subject of Data.Subjects) this.GetCell(Subject)?.DoNotNotify(Node.Name);
    Data.Subjects = Node.Subjects;
    for (const Subject of Data.Subjects) this.GetCell(Subject)?.Notify(Node.Name);
    Data.Subjects = Node.Subjects;
    this.GetSubjects(Data.Name, Data);
    return Data;
  }

  private GetSubjects(Name: string, Node: Cell, Subjects = new Set<string>()) {
    if (Node.Subjects.has(Name)) {
      this.Diagnostics.ReportCircularDependency(DiagnosticPhase.Binder, Name, Node.Name);
      return Subjects;
    }
    for (const Subject of Node.Subjects) {
      Subjects.add(Subject);
      const SubjectNode = this.GetCell(Subject);
      if (SubjectNode === undefined) return undefined;
      this.GetSubjects(Name, SubjectNode, Subjects);
    }
    return Subjects;
  }
}
