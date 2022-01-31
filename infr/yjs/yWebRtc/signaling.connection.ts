import * as buffer from "lib0/buffer";
import {log} from "./y-webrtc";
import {Room} from "./room";
import {WebrtcConnection} from "./webrtc.connection";
import {WebrtcProvider} from "./webrtc-provider";

export class SignalingConnection extends WebSocket {
    constructor(url: string) {
        super(url);
    }

    /**
     * @type {Set<WebrtcProvider>}
     */
    providers = new Set<WebrtcProvider>()

    public connected = false;

    onclose = () => {
        this.connected = false;
        log(`disconnect (${this.url})`)
    }

    onerror = () => {

    }

    onmessage = async (event: MessageEvent) => {
        const m = JSON.parse(event.data)
        if (m.type !== 'publish') {
            return;
        }
        const roomName = m.topic
        const room = Room.Rooms.get(roomName)
        if (room == null || typeof roomName !== 'string') {
            return
        }
        const data = await room.cryptor.decryptJson(buffer.fromBase64(m.data));
        const webrtcConns = room.webrtcConns;
        const peerId = room.peerId
        if (data == null || data.from === peerId || (data.to !== undefined && data.to !== peerId) || room.broadcastChannel.connections.has(data.from)) {
            // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
            return
        }
        switch (data.type) {
            case 'announce':
                if (webrtcConns.size < room.provider.options.maxConns) {
                    webrtcConns.getOrAdd(data.from, () => new WebrtcConnection(this, true, data.from, room));
                }
                break
            case 'signal':
                if (data.to === room.peerId) {
                    const connection = webrtcConns.getOrAdd(data.from, () => new WebrtcConnection(this, false, data.from, room));
                    connection.peer.signal(data.signal)
                }
                break
        }
    }

    onopen = (...args) => {
        this.connected = true;
        log(`connected (${this.url})`)
        const topics = Array.from(Room.Rooms.values()).map(room => room.topic);
        this.send({type: 'subscribe', topics})
        Room.Rooms.forEach(async room => this.send(await room.getSignalingMessage()));
    }

    send(data: any) {
        super.send(JSON.stringify(data));
    }

    destroy() {

    }
}