import {Injectable} from "@cmmn/core";
import {TokenParser} from "../../server/services/token.parser";
import {WebSocket} from "ws";
import {SignalingMessage} from "../shared/types";
import {AccessMode} from "@inhauth/core";
import {ClientConnection} from "./client-connection";
import {ServerRoom} from "./server-room";

@Injectable()
export class YjsWebrtcController {
    private rooms = new Map<string, ServerRoom>();
    private subscribedTopics = new Set<ServerRoom>();

    constructor(private parser: TokenParser) {
    }

    public async handleConnection(socket: WebSocket) {
        const registerMessage = await this.GetRegistrationMessage(socket);
        const room = this.rooms.getOrAdd(registerMessage.room, name => new ServerRoom(name));
        const connection = new ClientConnection(socket, {
            user: registerMessage.token.User,
            accessMode: registerMessage.token.AccessMode > AccessMode.read ? 'write' : 'read'
        });
        room.addClient(connection);
        this.subscribedTopics.add(room);
    }

    private GetRegistrationMessage(socket: WebSocket): Promise<{
        room: string;
        token: { User; AccessMode; }
    }> {
        return new Promise((resolve, reject) => {
            socket.once('message', async (msg: Buffer) => {
                const messageStr = msg.toString('utf8');
                const message = JSON.parse(messageStr) as SignalingMessage;
                if (message.type !== 'register') {
                    return;
                }
                const token = await this.parser.Parse<{ User: string; AccessMode: AccessMode; }>(message.info.token);
                if (!token) {
                    socket.send(JSON.stringify({
                        type: 'unauthenticated',
                        room: name
                    }))
                    reject();
                }
                resolve({
                    room: message.info.room,
                    token: token
                })
            });
        });
    }
}