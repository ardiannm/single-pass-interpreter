export enum DiagnosticKind {
  EmptyProgram = "EmptyProgram",
  BadTokenFound = "BadTokenFound",
  TokenNotAMatch = "TokenNotAMatch",
  CantDivideByZero = "CantDivideByZero",
  MissingOperatorKind = "MissingOperatorKind",
  CircularDependency = "CircularDependency",
  CantUseAsAReference = "CantUseAsAReference",
  NameNotFound = "NameNotFound",
  BadFloatingPointNumber = "BadFloatingPointNumber",
  ParserErrors = "ParserErrors",
}
