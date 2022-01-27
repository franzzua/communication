import * as random from "lib0/random";
import {createMutex} from "lib0/mutex";
import * as cryptoutils from "./crypto";
import * as encoding from "lib0/encoding";
import * as bc from "lib0/broadcastchannel";
import * as error from "lib0/error";
import * as awarenessProtocol from 'y-protocols/awareness'
import * as logging from "lib0/logging";
import {log} from "./y-webrtc";
import * as syncProtocol from 'y-protocols/sync'
import * as decoding from "lib0/decoding";
import {WebrtcProvider} from "./webrtc-provider";
import * as buffer from "lib0/buffer";


const messageSync = 0
const messageQueryAwareness = 3
const messageAwareness = 1
const messageBcPeerId = 4

export class Room {

    static Rooms = new Map<string, Room>();

    static Open(doc, provider, name, key, token): Room {
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
    webrtcConns = new Map();
    bcConns = new Set();
    mux = createMutex();
    bcconnected = false;

    constructor(private doc, public provider: WebrtcProvider, private name, public key, private token) {
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
     * @param {ArrayBuffer} data
     */
    _bcSubscriber = data =>
        cryptoutils.decrypt(new Uint8Array(data), this.key).then(m =>
            this.mux(() => {
                const reply = this.readMessage(m, () => {
                })
                if (reply) {
                    this.broadcastBcMessage(encoding.toUint8Array(reply))
                }
            })
        )
    /**
     * Listens to Yjs updates and sends them to remote peers
     *
     * @param {Uint8Array} update
     * @param {any} origin
     */
    _docUpdateHandler = (update, origin) => {
        const encoder = encoding.createEncoder()
        encoding.writeVarUint(encoder, messageSync)
        syncProtocol.writeUpdate(encoder, update)
        this.broadcastRoomMessage(encoding.toUint8Array(encoder))
    }
    /**
     * Listens to Awareness updates and sends them to remote peers
     *
     * @param {any} changed
     * @param {any} origin
     */
    _awarenessUpdateHandler = ({added, updated, removed}, origin) => {
        const changedClients = added.concat(updated).concat(removed)
        const encoderAwareness = encoding.createEncoder()
        encoding.writeVarUint(encoderAwareness, messageAwareness)
        encoding.writeVarUint8Array(encoderAwareness, awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients))
        this.broadcastRoomMessage(encoding.toUint8Array(encoderAwareness))
    }

    connect() {
        this.doc.on('update', this._docUpdateHandler)
        this.awareness.on('update', this._awarenessUpdateHandler)
        // signal through all available signaling connections
        this.announceSignalingInfo()
        const roomName = this.name
        bc.subscribe(roomName, this._bcSubscriber)
        this.bcconnected = true
        // broadcast peerId via broadcastchannel
        this.broadcastBcPeerId()
        // write sync step 1
        const encoderSync = encoding.createEncoder()
        encoding.writeVarUint(encoderSync, messageSync)
        syncProtocol.writeSyncStep1(encoderSync, this.doc)
        this.broadcastBcMessage(encoding.toUint8Array(encoderSync))
        // broadcast local state
        const encoderState = encoding.createEncoder()
        encoding.writeVarUint(encoderState, messageSync)
        syncProtocol.writeSyncStep2(encoderState, this.doc)
        this.broadcastBcMessage(encoding.toUint8Array(encoderState))
        // write queryAwareness
        const encoderAwarenessQuery = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessQuery, messageQueryAwareness)
        this.broadcastBcMessage(encoding.toUint8Array(encoderAwarenessQuery))
        // broadcast local awareness state
        const encoderAwarenessState = encoding.createEncoder()
        encoding.writeVarUint(encoderAwarenessState, messageAwareness)
        encoding.writeVarUint8Array(encoderAwarenessState, awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]))
        this.broadcastBcMessage(encoding.toUint8Array(encoderAwarenessState))
    }

    disconnect() {
        // signal through all available signaling connections
        this.provider.signalingConns.forEach(conn => {
            if (conn.connected) {
                conn.send({type: 'unsubscribe', topics: [this.name]})
            }
        })
        awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], 'disconnect')
        // broadcast peerId removal via broadcastchannel
        const encoderPeerIdBc = encoding.createEncoder()
        encoding.writeVarUint(encoderPeerIdBc, messageBcPeerId)
        encoding.writeUint8(encoderPeerIdBc, 0) // remove peerId from other bc peers
        encoding.writeVarString(encoderPeerIdBc, this.peerId)
        this.broadcastBcMessage(encoding.toUint8Array(encoderPeerIdBc))

        bc.unsubscribe(this.name, this._bcSubscriber)
        this.bcconnected = false
        this.doc.off('update', this._docUpdateHandler)
        this.awareness.off('update', this._awarenessUpdateHandler)
        this.webrtcConns.forEach(conn => conn.destroy())
    }

    destroy() {
        this.disconnect()
    }


    /**
     * @param {Room} room
     * @param {Uint8Array} m
     */
    broadcastBcMessage(m) {
        cryptoutils.encrypt(m, this.key).then(data =>
            this.mux(() =>
                bc.publish(this.name, data)
            )
        )
    }

    broadcastRoomMessage(m: Uint8Array) {
        if (this.bcconnected) {
            this.broadcastBcMessage(m)
        }
        this.broadcastWebrtcConn(m)
    }

    broadcastWebrtcConn(m: Uint8Array) {
        log('broadcast message in ', logging.BOLD, this.name, logging.UNBOLD)
        this.webrtcConns.forEach(conn => {
            try {
                conn.peer.send(m)
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
    public async getSignalingMessage(data = {type: 'announce', from: this.peerId}) {
        if (this.key) {
            const encryptedData = await cryptoutils.encryptJson(data, this.key);
            return {type: 'publish', topic: this.name, data: buffer.toBase64(encryptedData)}
        } else {
            return {type: 'publish', topic: this.name, data};
        }
    }

    /**
     * @param {Room} room
     */
    broadcastBcPeerId() {
        if (this.provider.options.filterBcConns) {
            // broadcast peerId via broadcastchannel
            const encoderPeerIdBc = encoding.createEncoder()
            encoding.writeVarUint(encoderPeerIdBc, messageBcPeerId)
            encoding.writeUint8(encoderPeerIdBc, 1)
            encoding.writeVarString(encoderPeerIdBc, this.peerId)
            this.broadcastBcMessage(encoding.toUint8Array(encoderPeerIdBc))
        }
    }

    /**
     * @param {Room} room
     * @param {Uint8Array} buf
     * @param {function} syncedCallback
     * @return {encoding.Encoder?}
     */
    readMessage(buf, syncedCallback) {
        const decoder = decoding.createDecoder(buf)
        const encoder = encoding.createEncoder()
        const messageType = decoding.readVarUint(decoder)
        const awareness = this.awareness
        const doc = this.doc
        let sendReply = false
        switch (messageType) {
            case messageSync: {
                encoding.writeVarUint(encoder, messageSync)
                const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, this)
                if (syncMessageType === syncProtocol.messageYjsSyncStep2 && !this.synced) {
                    syncedCallback()
                }
                if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
                    sendReply = true
                }
                break
            }
            case messageQueryAwareness:
                encoding.writeVarUint(encoder, messageAwareness)
                encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awareness.getStates().keys())))
                sendReply = true
                break
            case messageAwareness:
                awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), this)
                break
            case messageBcPeerId: {
                const add = decoding.readUint8(decoder) === 1
                const peerName = decoding.readVarString(decoder)
                if (peerName !== this.peerId && ((this.bcConns.has(peerName) && !add) || (!this.bcConns.has(peerName) && add))) {
                    const removed = []
                    const added = []
                    if (add) {
                        this.bcConns.add(peerName)
                        added.push(peerName)
                    } else {
                        this.bcConns.delete(peerName)
                        removed.push(peerName)
                    }
                    this.provider.emit('peers', [{
                        added,
                        removed,
                        webrtcPeers: Array.from(this.webrtcConns.keys()),
                        bcPeers: Array.from(this.bcConns)
                    }])
                    this.broadcastBcPeerId()
                }
                break
            }
            default:
                console.error('Unable to compute message')
                return encoder
        }
        if (!sendReply) {
            // nothing has been written, no answer created
            return null
        }
        return encoder
    }


}