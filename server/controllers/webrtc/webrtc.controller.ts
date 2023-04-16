import {controller, Get} from "@cmmn/server";
import {SocketStream} from "@fastify/websocket";
import {FastifyRequest} from "fastify";
import {bind, Injectable} from "@cmmn/core";
import {WebrtcController as BaseWebrtcController} from "@cmmn/sync/webrtc/server";
import {TokenParser} from "../../services/token.parser";

@Injectable()
@controller('/api')
export class WebrtcController extends BaseWebrtcController{

    constructor(parser: TokenParser) {
        super(parser)
    }

    @Get('', {webSocket: true})
    public async onConnection(connection: SocketStream, request: FastifyRequest) {
        super.handleConnection(connection.socket as any);
    }


}

// @ts-ignore



