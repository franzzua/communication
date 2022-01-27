import {controller, Get} from "@cmmn/server";
import {YWebrtcHandler} from "./y-webrtc.handler";
import {SocketStream} from "fastify-websocket";
import {FastifyRequest} from "fastify";
import {bind, Injectable} from "@cmmn/core";
import {TokenParser} from "../services/token.parser";
import {Authorizer} from "../services/authorizer.service";
import {ResourceToken} from "@inhauth/core";

@Injectable()
@controller('/api')
export class WebrtcController {

    constructor(private authorizer: Authorizer,
                private tokenParser: TokenParser) {
    }

    @Get('', {webSocket: true})
    public async onConnection(connection: SocketStream, request: FastifyRequest) {
        const handler = new YWebrtcHandler(connection.socket, this.auth);
    }

    @bind
    private async auth(uri, tokenStr): Promise<boolean> {
        const token = await this.tokenParser.Parse<ResourceToken>(tokenStr);
        if (!token)
            return false;
        const result = await this.authorizer.Authorize({uri, token}).catch();
        return result != null;
    }

}

// @ts-ignore



