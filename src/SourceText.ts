import { LineText } from "./LineText";

export class SourceText {
  private Index = 0;
  private LineTexts = new Array<LineText>();
  private LineIndex = 1;

  constructor(public Text: string) {
    this.ParseLines();
  }

  private ParseLines() {
    let Start = this.Index;
    while (this.Index < this.Text.length) {
      const Char = this.Text.charAt(this.Index);
      if (Char === "\n") {
        this.LineTexts.push(new LineText(this.LineIndex, Start, this.Index));
        this.LineIndex++;
        Start = this.Index;
      }
      this.Index++;
    }

    this.LineTexts.push(new LineText(this.LineIndex, Start, this.Index));
    return this.LineTexts;
  }

  GetLineText(Position: number): LineText {
    let Left = 0;
    let Right = this.LineTexts.length - 1;
    while (true) {
      const Index = Left + Math.floor((Right - Left) / 2);
      const LineText = this.LineTexts[Index];
      if (Position >= LineText.Start && Position < LineText.End) {
        return LineText;
      }
      if (Position < LineText.Start) Right = Index - 1;
      else Left = Index + 1;
    }
  }

  static From(Text: string) {
    return new SourceText(Text);
  }
}