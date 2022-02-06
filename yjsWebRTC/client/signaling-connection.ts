import {Observable} from "lib0/observable.js";
import {SignalingMessage, SignalingRegistrationInfo, SignalingServerMessage, SignalMessage} from "../shared/types";
import {bind} from "@cmmn/core";

export class SignalingConnection extends Observable<any> {


    private connected$ = new Promise(resolve => this.socket.onopen = resolve);


    constructor(private socket: WebSocket) {
        super();
        this.socket.onmessage = this.onMessage;
    }

    public async connect() {
        return await this.connected$;
    }

    public async disconnect() {
        this.socket.close();
    }

    private encoder = new TextEncoder();

    private send(data: SignalingMessage) {
        // const buffer = this.encoder.encode(JSON.stringify(data));
        this.socket.send(JSON.stringify(data));
    }

    private decoder = new TextDecoder();

    @bind
    private onMessage(event: MessageEvent) {
        const stringData = typeof event.data === "string" ? event.data :  this.decoder.decode(event.data);
        const message = JSON.parse(stringData) as SignalingServerMessage;
        switch (message.type) {
            case "signal":
                this.emit('signal', [message]);
                break;
            case "announce":
                this.emit('announce', [message.room, message.users]);
                break;
        }
    };

    public async register(info: SignalingRegistrationInfo) {
        await this.connected$;
        this.send({
            type: 'register',
            info
        });
    }

    public async sendSignal(msg: SignalMessage) {
        this.send(msg);
    }
}

