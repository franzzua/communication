import {Server} from "@cmmn/server";
import fastify from "fastify";
import wsPlugin from "@fastify/websocket";
import cookiePlugin from "@fastify/cookie";
import {InhauthContainer} from "./inhauth";
import {ServerContainer} from "./container";
import * as controllers from "./controllers";
console.log(Object.values(controllers))
async function run() {
    const server = await Server
        // @ts-ignore
        .withFastify(getFastify)
        .with(InhauthContainer)
        .withControllers(...Object.values(controllers))
        .with(ServerContainer)
        .start(+(process.env.PORT || 4004));
    // const server = new http.Server();
}

function getFastify(opts){
    const instance = fastify(opts);
    instance.register(wsPlugin);
    instance.register(cookiePlugin);
    return instance;
}

run();


// server.on('upgrade', app.onUpgrade())