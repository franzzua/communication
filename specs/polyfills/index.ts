// @ts-ignore

global.self = global.window = global;
global.addEventListener = () => {};

import * as ws from "ws";
global.WebSocket = ws;


import setGlobalVars from 'indexeddbshim';

// @ts-ignore
global.window = global; // We'll allow ourselves to use `window.indexedDB` or `indexedDB` as a global
// @ts-ignore
global.shimNS = true;
setGlobalVars();
// @ts-ignore
global.shimIndexedDB.__useShim();
// @ts-ignore
global.shimIndexedDB.__setConfig({checkOrigin: false});
