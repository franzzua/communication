import * as random from "lib0/random";
import * as error from "lib0/error";
import * as logging from "lib0/logging";
import {log} from "./y-webrtc";
import * as awarenessProtocol from 'y-protocols/awareness'
import * as decoding from "lib0/decoding";
import {WebrtcProvider} from "./webrtc-provider";
import * as buffer from "lib0/buffer";
import {WebrtcConnection} from "@infr/yjs/yWebRtc/webrtc.connection";
import {BroadcastChannelConnection} from "@infr/yjs/yWebRtc/broadcast-channel.connection";
import {MessageSerializer} from "@infr/yjs/yWebRtc/message-serializer";
import {Cryptor} from "@infr/yjs/yWebRtc/cryptor";

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

    static Open(doc, provider, name, cryptor: Cryptor, token): Room {
        // there must only be one room
        if (Room.Rooms.has(name)) {
            throw error.create(`A Yjs Doc connected to room "${name}" already exists!`)
        }
        const room = new Room(doc, provider, name, cryptor, token)
        Room.Rooms.set(name, /** @type {Room} */ (room))
        return room
    }

    /**
     * Do not assume that peerId is unique. This is only meant for sending signaling messages.
     *
     * @type {string}
     */
    public peerId = random.uuidv4()
    private awareness = this.provider.awareness
    private synced = false
    public webrtcConns = new Map<string, WebrtcConnection>();
    public broadcastChannel: BroadcastChannelConnection;// = new BroadcastChannelConnection(this);
    public serializer = new MessageSerializer(this.doc, this.awareness);
    // bcConns = new Set();
    // bcconnected = false;

    constructor(public doc, public provider: WebrtcProvider, public name, public cryptor: Cryptor, private token) {
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
        const buf = this.serializer.getUpdate(update);
        this.broadcast(buf);
    }
    /**
     * Listens to Awareness updates and sends them to remote peers
     */
    _awarenessUpdateHandler = ({added, updated, removed}, origin) => {
        const changedClients = added.concat(updated).concat(removed)
        const buf = this.serializer.getAwarenessMessage(changedClients);
        this.broadcast(buf);
    }

    connect() {
        this.doc.on('update', this._docUpdateHandler);
        this.awareness.on('update', this._awarenessUpdateHandler);
        this.broadcastChannel?.connect();
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
        if (this.broadcastChannel?.connected) {
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
    public async getSignalingMessage(data: object = {type: 'announce', from: this.peerId}) {
        const encrypted = await this.cryptor.encryptJson(data);
        return {type: 'publish', topic: this.name, data: buffer.toBase64(new Uint8Array(encrypted))}
    }


    /**
     * @param {Room} room
     * @param {Uint8Array} buf
     * @param {function} syncedCallback
     * @return {encoding.Encoder?}
     */
    getAnswer(buf: ArrayBuffer, syncedCallback?): Uint8Array | void {
        const decoder = decoding.createDecoder(new Uint8Array(buf));
        const messageType = decoding.readVarUint(decoder) as MessageType;
        switch (messageType) {
            case MessageType.Sync1: {
                decoding.readVarUint(decoder)
                return this.serializer.writeSync1(decoder);
            }
            case MessageType.Sync2:
                decoding.readVarUint(decoder)
                this.serializer.writeSync2(decoder);
                if (!this.synced && syncedCallback) {
                    syncedCallback()
                }
                return;
            case MessageType.SyncUpdate:
                decoding.readVarUint(decoder)
                return this.serializer.writeUpdate(decoder);
            case MessageType.QueryAwareness:
                return this.serializer.getAwarenessMessage();
            case MessageType.Awareness:
                return this.serializer.writeAwareness(decoder);
            default:
                console.error('Unable to compute message')
                return;
        }
    }


    public emitPeersChanged(added: string[], removed: string[]) {
        this.provider.emit('peers', [{
            added,
            removed,
            webrtcPeers: Array.from(this.webrtcConns.keys()),
            bcPeers: Array.from(this.broadcastChannel?.connections ?? [])
        }])
    }
}

