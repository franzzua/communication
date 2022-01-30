import * as random from "lib0/random";
import * as cryptoutils from "./crypto";
import * as encoding from "lib0/encoding";
import * as error from "lib0/error";
import * as logging from "lib0/logging";
import {log} from "./y-webrtc";
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as decoding from "lib0/decoding";
import {WebrtcProvider} from "./webrtc-provider";
import * as buffer from "lib0/buffer";
import {WebrtcConnection} from "@infr/yjs/yWebRtc/webrtc.connection";
import {BroadcastChannelConnection} from "@infr/yjs/yWebRtc/broadcast-channel.connection";

export enum MessageType {
    Sync1 = 0,
    Sync2 = 2,
    SyncUpdate = 7,
    QueryAwareness = 3,
    Awareness = 1,

    AddPeer = 4,
    RemovePeer = 5
};


// const messageSync = 0
// const messageQueryAwareness = 3
// const messageAwareness = 1

// const messageBcPeerId = 4


export class RoomBroadcastChannel {
    constructor(private room: Room) {

    }

}

export class Room {

    static Rooms = new Map<string, Room>();

    static Open(doc, provider, name, key: CryptoKey, token): Room {
        // there must only be one room
        if (Room.Rooms.has(name)) {
            throw error.create(`A Yjs Doc connected to room "${name}" already exists!`)
        }
        const room = new Room(doc, provider, name, key, token)
        Room.Rooms.set(name, /** @type {Room} */ (room))
        return room
    }

    /**
     * Do not assume that peerId is unique. This is only meant for sending signaling messages.
     *
     * @type {string}
     */
    peerId = random.uuidv4()
    awareness = this.provider.awareness
    synced = false
    webrtcConns = new Map<string, WebrtcConnection>();
    broadcastChannel = new BroadcastChannelConnection(this);
    // bcConns = new Set();
    // bcconnected = false;

    constructor(public doc, public provider: WebrtcProvider, public name, public key: CryptoKey, private token) {
        window.addEventListener('beforeunload', () => {
            awarenessProtocol.removeAwarenessStates(this.awareness, [doc.clientID], 'window unload')
            Room.Rooms.forEach(room => {
                room.disconnect()
            })
        })
    }

    get topic() {
        return {name: this.name, token: this.token};
    }

    /**
     * Listens to Yjs updates and sends them to remote peers
     */
    _docUpdateHandler = (update, origin) => {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MessageType.SyncUpdate);
        syncProtocol.writeUpdate(encoder, update);
        this.broadcast(encoding.toUint8Array(encoder));
    }
    /**
     * Listens to Awareness updates and sends them to remote peers
     */
    _awarenessUpdateHandler = ({added, updated, removed}, origin) => {
        const changedClients = added.concat(updated).concat(removed)
        const encoderAwareness = encoding.createEncoder()
        encoding.writeVarUint(encoderAwareness, MessageType.Awareness)
        encoding.writeVarUint8Array(encoderAwareness, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
        this.broadcast(encoding.toUint8Array(encoderAwareness))
    }

    connect() {
        this.doc.on('update', this._docUpdateHandler);
        this.awareness.on('update', this._awarenessUpdateHandler);
        this.broadcastChannel.connect();
        // signal through all available signaling connections
        this.announceSignalingInfo();
        // const roomName = this.name
        // bc.subscribe(roomName, this._bcSubscriber)

    }

    disconnect() {
        // signal through all available signaling connections
        this.provider.signalingConns.forEach(conn => {
            if (conn.connected) {
                conn.send({type: 'unsubscribe', topics: [this.name]})
            }
        })
        awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], 'disconnect')

        this.doc.off('update', this._docUpdateHandler)
        this.awareness.off('update', this._awarenessUpdateHandler)
        this.webrtcConns.forEach(conn => conn.destroy())
    }

    broadcast(m: Uint8Array) {
        log('broadcast message in ', logging.BOLD, this.name, logging.UNBOLD)
        if (this.broadcastChannel.connected) {
            this.broadcastChannel.send(m);
        }
        this.webrtcConns.forEach(conn => {
            try {
                conn.send(m)
            } catch (e) {
            }
        })
    }

    /**
     * @param {Room} room
     */
    announceSignalingInfo() {
        this.provider.signalingConns.forEach(async conn => {
            // only subcribe if connection is established, otherwise the conn automatically subscribes to all rooms
            if (conn.connected) {
                conn.send({type: 'subscribe', topics: [this.topic]})
                if (this.webrtcConns.size < this.provider.options.maxConns) {
                    conn.send(await this.getSignalingMessage());
                }
            }
        })
    }


    /**
     * @param {SignalingConn} conn
     * @param {Room} room
     * @param {any} data
     */
    public async getSignalingMessage(data: any = {type: 'announce', from: this.peerId}) {
        if (this.key) {
            const encryptedData = await cryptoutils.encryptJson(data, this.key);
            return {type: 'publish', topic: this.name, data: buffer.toBase64(encryptedData)}
        } else {
            return {type: 'publish', topic: this.name, data};
        }
    }


    /**
     * @param {Room} room
     * @param {Uint8Array} buf
     * @param {function} syncedCallback
     * @return {encoding.Encoder?}
     */
    getAnswer(buf, syncedCallback?): Uint8Array | null {
        const decoder = decoding.createDecoder(buf)
        const messageType = decoding.readVarUint(decoder) as MessageType;
        const doc = this.doc
        switch (messageType) {
            case MessageType.Sync1: {
                decoding.readVarUint(decoder)
                const encoder = encoding.createEncoder();

                encoding.writeVarUint(encoder, MessageType.Sync2);
                syncProtocol.readSyncStep1(decoder, encoder, doc);
                return encoding.toUint8Array(encoder);
            }
            case MessageType.Sync2:
                decoding.readVarUint(decoder)
                syncProtocol.readSyncStep2(decoder, doc, this);
                if (!this.synced && syncedCallback) {
                    syncedCallback()
                }
                return;
            case MessageType.SyncUpdate:
                decoding.readVarUint(decoder)
                syncProtocol.readUpdate(decoder, doc, this);
                return;
            case MessageType.QueryAwareness:
                return this.getAwarenessMessage();
            case MessageType.Awareness:
                awarenessProtocol.applyAwarenessUpdate(this.awareness, decoding.readVarUint8Array(decoder), this)
                return;

            default:
                console.error('Unable to compute message')
                return;
        }
    }

    public getSync1Message() {
        const encoderSync = encoding.createEncoder()
        encoding.writeVarUint(encoderSync, MessageType.Sync1)
        syncProtocol.writeSyncStep1(encoderSync, this.doc)
        return encoding.toUint8Array(encoderSync);
    }

    public getSync2Message() {
        const encoderState = encoding.createEncoder()
        encoding.writeVarUint(encoderState, MessageType.Sync2)
        syncProtocol.writeSyncStep2(encoderState, this.doc)
        return encoding.toUint8Array(encoderState);
    }

    public getAwarenessMessage() {
        const encoderAwarenessState = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessState, MessageType.Awareness)
        encoding.writeVarUint8Array(encoderAwarenessState, awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]))
        return encoding.toUint8Array(encoderAwarenessState);
    }

    public getQueryAwarenessMessage() {
        const encoderAwarenessQuery = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessQuery, MessageType.QueryAwareness)
        return encoding.toUint8Array(encoderAwarenessQuery);
    }


}