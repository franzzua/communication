import {controller, Get} from "@cmmn/server";
import {SocketStream} from "fastify-websocket";
import {FastifyRequest} from "fastify";
import {bind, Injectable} from "@cmmn/core";
import {YjsWebrtcController} from "../../yjsWebRTC/server/yjs-webrtc-controller.service";

@Injectable()
@controller('/api')
export class WebrtcController{

    constructor(private yjs: YjsWebrtcController) {
    }

    @Get('', {webSocket: true})
    public async onConnection(connection: SocketStream, request: FastifyRequest) {
        this.yjs.handleConnection(connection.socket);
    }


}

// @ts-ignore



