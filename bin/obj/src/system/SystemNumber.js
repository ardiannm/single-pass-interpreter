"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const System_1 = __importDefault(require("./System"));
class SystemNumber extends System_1.default {
    value;
    constructor(value) {
        super();
        this.value = value;
    }
}
exports.default = SystemNumber;
