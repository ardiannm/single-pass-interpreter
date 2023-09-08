import prompt from "prompt-sync";
import ImportFile from "./src/services/ImportFile";
import Parser from "./src/Parser";
import Interpreter from "./src/Interpreter";
import System from "./src/system/System";
import SystemNumber from "./src/system/SystemNumber";
import SystemString from "./src/system/SystemString";
import SystemException from "./src/system/SystemException";

let showTree = true;
const report = (tree: Object) => console.log(JSON.stringify(tree, undefined, 3));

while (true) {
  const path = "dev/tests/tests.code";
  const input = prompt({ sigint: true })(">> ") || ImportFile(path);
  if (input.toLowerCase() === "tree".toLowerCase()) {
    showTree = !showTree;
    continue;
  }
  try {
    const program = new Parser(input, path).parse();
    if (showTree) report(program);
    const system = new Interpreter().evaluate(program);
    if (system instanceof SystemNumber) report(system.value);
    else if (system instanceof SystemString) report(system.value);
    else report(system);
  } catch (err) {
    if (err instanceof System) report(err);
    else if (err instanceof SystemException) console.log(err.value);
    else console.log(err);
  }
}
