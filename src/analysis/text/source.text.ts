import { LineSpan } from "./line.span";

export class SourceText {
  private lines = new Array<LineSpan>();

  private constructor(private text: string) {
    let start = 0;
    let position = 0;
    while (position < this.text.length) {
      const c = this.text[position];
      position++;
      if (c === "\n") {
        this.lines.push(LineSpan.createFrom(this, start, position, 1));
        start = position;
      }
    }
    this.lines.push(LineSpan.createFrom(this, start, position, 0));
    start = position;
  }

  static createFrom(text: string): SourceText {
    return new SourceText(text);
  }

  private getLinePosition(position: number): number {
    let lower = 0;
    let upper = this.lines.length - 1;
    while (lower <= upper) {
      var index = Math.floor(lower + (upper - lower) / 2);
      var start = this.lines[index].start;
      if (position === start) return index;
      if (start > position) {
        upper = index - 1;
      } else {
        lower = index + 1;
      }
    }
    return lower - 1;
  }

  getLine(position: number) {
    return this.getLinePosition(position) + 1;
  }

  getColumn(position: number): number {
    const span = this.getLinePosition(position);
    return position - this.lines[span].start + 1;
  }

  getLines() {
    return this.lines;
  }

  getText(start: number, end: number): string {
    return this.text.substring(start, end);
  }
}
