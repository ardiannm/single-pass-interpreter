import { BoundKind } from "./BoundKind";
import { IsReferable } from "./IsReferable";

export class BoundCellReference extends IsReferable {
  constructor(public Kind: BoundKind, public Name: string) {
    super(Kind, Name);
  }
}
