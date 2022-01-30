import * as cryptoutils from "./crypto";
import * as buffer from "lib0/buffer";
import {log} from "./y-webrtc";
import {Room} from "./room";
import {WebrtcConn} from "./webrtc-conn";
import {WebrtcProvider} from "./webrtc-provider";

export class SignalingConn extends WebSocket {
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

    onmessage = (event: MessageEvent) => {
        const m = JSON.parse(event.data)
        if (m.type !== 'publish') {
            return;
        }
        const roomName = m.topic
        const room = Room.Rooms.get(roomName)
        if (room == null || typeof roomName !== 'string') {
            return
        }
        const execMessage = data => {
            const webrtcConns = room.webrtcConns
            const peerId = room.peerId
            if (data == null || data.from === peerId || (data.to !== undefined && data.to !== peerId) || room.bcConns.has(data.from)) {
                // ignore messages that are not addressed to this conn, or from clients that are connected via broadcastchannel
                return
            }
            const emitPeerChange = webrtcConns.has(data.from) ? () => {
            } : () =>
                room.provider.emit('peers', [{
                    removed: [],
                    added: [data.from],
                    webrtcPeers: Array.from(room.webrtcConns.keys()),
                    bcPeers: Array.from(room.bcConns)
                }])
            switch (data.type) {
                case 'announce':
                    if (webrtcConns.size < room.provider.options.maxConns) {
                        webrtcConns.getOrAdd(data.from, () => new WebrtcConn(this, true, data.from, room));
                        emitPeerChange()
                    }
                    break
                case 'signal':
                    if (data.to === peerId) {
                        webrtcConns.getOrAdd(data.from, () => new WebrtcConn(this, false, data.from, room)).peer.signal(data.signal)
                        emitPeerChange()
                    }
                    break
            }
        }
        if (room.key) {
            if (typeof m.data === 'string') {
                cryptoutils.decryptJson(buffer.fromBase64(m.data), room.key).then(execMessage)
            }
        } else {
            execMessage(m.data)
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