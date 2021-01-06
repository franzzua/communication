// @ts-ignore
global.window = global;

global.addEventListener = () => {};

import * as ws from "ws";
global.WebSocket = ws;