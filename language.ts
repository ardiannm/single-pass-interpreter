import { Division } from "./division.ts";
import { Minus } from "./minus.ts";
import { Multiplication } from "./multiplication.ts";
import { Plus } from "./plus.ts";
import { Number } from "./number.ts";
import { Identifier } from "./identifier.ts";
import { Binary } from "./binary.ts";
import { Unary } from "./unary.ts";
import { DoubleQuoteString } from "./double.quote.string.ts";

export type IdentifierOrNumber = Identifier | Number
export type Operator = Plus | Minus | Division | Multiplication
export type Expression = IdentifierOrNumber | Binary | Unary | DoubleQuoteString