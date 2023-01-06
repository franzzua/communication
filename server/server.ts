import {WebrtcController} from "./webrtc/webrtc.controller";
import {Server} from "@cmmn/server";
import fastify from "fastify";

import {ContextController} from "./controllers/context.controller";
import {InhauthContainer} from "./inhauth";
import {ServerContainer} from "./container";
import {PublicKeyController} from "./controllers/public-key.controller";

async function run() {
    const server = await Server
        // @ts-ignore
        .withFastify(fastify)
        .with(InhauthContainer)
        .withControllers(ContextController, WebrtcController, PublicKeyController)
        .with(ServerContainer)
        .start(+(process.env.PORT || 4004));
    // const server = new http.Server();
}


run();


// server.on('upgrade', app.onUpgrade())