import {WebSocket} from "ws";
import {SignalingServerMessage} from "../shared/types";

export class ClientConnection {
    constructor(private socket: WebSocket,
                public userInfo: {
                    user: string, accessMode: 'read' | 'write'
                }) {
        this.listenPingPong();
    }

    private listenPingPong() {
        let pongReceived = true;
        const pingInterval = setInterval(() => {
            if (!pongReceived) {
                this.socket.close()
                clearInterval(pingInterval)
            } else {
                pongReceived = false
                try {
                    this.socket.ping()
                } catch (e) {
                    this.socket.close()
                }
            }
        }, pingTimeout)
        this.socket.on('pong', () => {
            pongReceived = true
        })
    }

    public send(message: SignalingServerMessage) {
        // const buffer = new Buffer(JSON.stringify(message), 'utf8');
        this.socket.send(JSON.stringify(message),);
    }
}

const pingTimeout = 30000
