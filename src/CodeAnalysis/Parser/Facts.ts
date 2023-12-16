import { SyntaxKind } from "./SyntaxKind";

export class Facts {
  public static UnaryOperatorPrecedence(kind: SyntaxKind) {
    switch (kind) {
      case SyntaxKind.PlusToken:
      case SyntaxKind.MinusToken:
        return 3;
      default:
        return 0;
    }
  }

  public static BinaryOperatorPrecedence(kind: SyntaxKind) {
    switch (kind) {
      case SyntaxKind.StarToken:
      case SyntaxKind.SlashToken:
        return 2;
      case SyntaxKind.PlusToken:
      case SyntaxKind.MinusToken:
        return 1;
      default:
        return 0;
    }
  }

  public static Kind(text: string): SyntaxKind {
    switch (text) {
      case "+":
        return SyntaxKind.PlusToken;
      case "-":
        return SyntaxKind.MinusToken;
      case "*":
        return SyntaxKind.StarToken;
      case "/":
        return SyntaxKind.SlashToken;
      case ":":
        return SyntaxKind.ColonToken;
      case "(":
        return SyntaxKind.OpenParenToken;
      case ")":
        return SyntaxKind.CloseParenToken;
      case ".":
        return SyntaxKind.DotToken;
      case "#":
        return SyntaxKind.HashToken;
      case ">":
        return SyntaxKind.GreaterToken;
      case "\n":
        return SyntaxKind.NewLineToken;
      case "":
        return SyntaxKind.EndOfFileToken;
      default:
        return SyntaxKind.BadToken;
    }
  }

  public static KeywordTokenKind(text: string): SyntaxKind {
    switch (text) {
      case "true":
        return SyntaxKind.TrueKeyword;
      case "false":
        return SyntaxKind.FalseKeyword;
      default:
        return SyntaxKind.IdentifierToken;
    }
  }
}