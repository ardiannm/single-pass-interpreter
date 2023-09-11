"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tag_1 = __importDefault(require("./Tag"));
class CloseTag extends Tag_1.default {
    tag;
    constructor(tag) {
        super();
        this.tag = tag;
    }
}
exports.default = CloseTag;