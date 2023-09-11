"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Expression_1 = __importDefault(require("./Expression"));
class Binary extends Expression_1.default {
    left;
    right;
    constructor(left, right) {
        super();
        this.left = left;
        this.right = right;
    }
}
exports.default = Binary;