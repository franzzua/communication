import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from "lib0/encoding";
import * as bc from "lib0/broadcastchannel";
import * as cryptoutils from "./crypto";
import {MessageType, Room} from "./room";
import {bind} from "@cmmn/core";
import {createMutex} from "lib0/mutex";
import * as decoding from "lib0/decoding";

export class BroadcastChannelConnection {
    public connected: boolean;
    public bcConns = new Set<string>();

    constructor(private room: Room) {
        bc.subscribe(room.name, this.listener);
    }

    mux = createMutex();

    async connect() {
        this.connected = true
        // broadcast peerId via broadcastchannel
        this.broadcastBcPeerId()
        // write sync step 1
        this.send(this.room.getSync1Message());
        // broadcast local state
        this.send(this.room.getSync2Message());
        // write queryAwareness
        this.send(this.room.getQueryAwarenessMessage());
        // broadcast local awareness state
        this.send(this.room.getAwarenessMessage());
    }

    @bind
    async listener(data) {
        const m = await cryptoutils.decrypt(new Uint8Array(data), this.room.key);
        const decoder = decoding.createDecoder(m);
        const messageType = decoding.readVarUint(decoder) as MessageType;
        switch (messageType) {
            case MessageType.AddPeer:
                const peerName = decoding.readVarString(decoder);
                if (peerName === this.room.peerId || this.bcConns.has(peerName)) {
                    return;
                }
                this.bcConns.add(peerName);
                this.room.provider.emit('peers', [{
                    added: [peerName],
                    removed: [],
                    webrtcPeers: Array.from(this.room.webrtcConns.keys()),
                    bcPeers: Array.from(this.bcConns)
                }])
                this.broadcastBcPeerId();
                return;
            case MessageType.RemovePeer: {
                const peerName = decoding.readVarString(decoder);
                if (peerName === this.room.peerId || !this.bcConns.has(peerName)) {
                    return;
                }
                this.bcConns.delete(peerName)
                this.room.provider.emit('peers', [{
                    added: [],
                    removed: [peerName],
                    webrtcPeers: Array.from(this.room.webrtcConns.keys()),
                    bcPeers: Array.from(this.bcConns)
                }])
                this.broadcastBcPeerId()
                return;
            }
        }
        this.mux(() => {
            const reply = this.room.getAnswer(m);
            if (reply) {
                this.send(reply)
            }
        });
    }

    /**
     * @param {Room} room
     * @param {Uint8Array} m
     */
    async send(m) {
        const data = await cryptoutils.encrypt(m, this.room.key);
        this.mux(() =>
            bc.publish(this.room.name, data)
        );
    }

    async disconnect() {
        bc.unsubscribe(this.room.name, this.listener);
        const encoderPeerIdBc = encoding.createEncoder();
        encoding.writeVarUint(encoderPeerIdBc, MessageType.RemovePeer);
        encoding.writeVarString(encoderPeerIdBc, this.room.peerId);
        await this.send(encoding.toUint8Array(encoderPeerIdBc));
        this.connected = false;
    }

    /**
     * @param {Room} room
     */
    broadcastBcPeerId() {
        if (this.room.provider.options.filterBcConns) {
            // broadcast peerId via broadcastchannel
            const encoderPeerIdBc = encoding.createEncoder()
            encoding.writeVarUint(encoderPeerIdBc, MessageType.AddPeer);
            encoding.writeVarString(encoderPeerIdBc, this.room.peerId)
            this.send(encoding.toUint8Array(encoderPeerIdBc))
        }
    }
}