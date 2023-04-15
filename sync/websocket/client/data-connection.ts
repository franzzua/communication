import {PeerConnection, MessageType} from "../../shared";
import {WebsocketConnection} from "./websocket-connection";

export class DataConnection extends PeerConnection {
    constructor(private connection: WebsocketConnection,
                private roomName: string) {
        super({accessMode: "write", user: "Bob"}, false);
        this.connection.on('message', message => {
            this.emit(message.type, message.data);
        })
    }

    public send(type: MessageType, data: Uint8Array) {
        this.connection.send({
            room: this.roomName,
            type: type,
            data
        });
    }

}