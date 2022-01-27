import {WebrtcController} from "./webrtc/webrtc.controller";
import {Server} from "@cmmn/server";
import fastify from "fastify";

import {ContextController} from "./controllers/context.controller";
import {InhauthContainer} from "./inhauth";
import {TokenParser} from "./services/token.parser";
import {Authorizer} from "./services/authorizer.service";
import {AclStore} from "./services/acl.store";

async function run() {
    const server = await Server
        // @ts-ignore
        .withFastify(fastify)
        .with(InhauthContainer)
        .withControllers(ContextController, WebrtcController)
        .withControllers(TokenParser, Authorizer, AclStore)
        .start(3003);
    // const server = new http.Server();
}


run();


// server.on('upgrade', app.onUpgrade())