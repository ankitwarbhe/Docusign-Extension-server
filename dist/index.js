"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./preStart");
const env_1 = __importDefault(require("./env"));
const server_1 = __importDefault(require("./server"));
const SERVER_START_MSG = 'Express server started on port: ' + env_1.default.PORT.toString();
server_1.default.listen(env_1.default.PORT, () => console.info(SERVER_START_MSG));
