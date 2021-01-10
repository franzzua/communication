// @ts-ignore

global.self = global.window = global;
global.addEventListener = () => {};

import * as ws from "ws";
global.WebSocket = ws;

