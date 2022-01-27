import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as logging from "lib0/logging";
import * as encoding from "lib0/encoding";
import {log} from "./y-webrtc";
import * as SimplePeer from "simple-peer"

export class WebrtcConn {
    private closed = false;
    private connected = false;
    private synced = false;
    private peer = new SimplePeer({
        initiator: this.initiator,
        ...this.room.provider.options.peerOpts
    });

    /**
     * @param {SignalingConn} signalingConn
     * @param {boolean} initiator
     * @param {string} remotePeerId
     * @param {Room} room
     */
    constructor(private signalingConn, private initiator, private remotePeerId, private room) {
        log('establishing connection to ', logging.BOLD, remotePeerId)
        /**
         * @type {any}
         */
        this.peer.on('signal', async signal => {
            signalingConn.send(await room.getSignalingMessage({
                to: remotePeerId,
                from: room.peerId,
                type: 'signal',
                signal
            }));
        })
        this.peer.on('connect', () => {
            log('connected to ', logging.BOLD, remotePeerId)
            this.connected = true
            // send sync step 1
            const provider = room.provider
            const doc = provider.doc
            const awareness = room.awareness
            const encoder = encoding.createEncoder()
            encoding.writeVarUint(encoder, messageSync)
            syncProtocol.writeSyncStep1(encoder, doc)
            sendWebrtcConn(this, encoder)
            const awarenessStates = awareness.getStates()
            if (awarenessStates.size > 0) {
                const encoder = encoding.createEncoder()
                encoding.writeVarUint(encoder, messageAwareness)
                encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, Array.from(awarenessStates.keys())))
                sendWebrtcConn(this, encoder)
            }
        })
        this.peer.on('close', () => {
            this.connected = false
            this.closed = true
            if (room.webrtcConns.has(this.remotePeerId)) {
                room.webrtcConns.delete(this.remotePeerId)
                room.provider.emit('peers', [{
                    removed: [this.remotePeerId],
                    added: [],
                    webrtcPeers: Array.from(room.webrtcConns.keys()),
                    bcPeers: Array.from(room.bcConns)
                }])
            }
            checkIsSynced(room)
            this.peer.destroy()
            log('closed connection to ', logging.BOLD, remotePeerId)
            room.announceSignalingInfo()
        })
        this.peer.on('error', err => {
            log('Error in connection to ', logging.BOLD, remotePeerId, ': ', err)
            room.announceSignalingInfo()
        })
        this.peer.on('data', data => {
            const answer = this.readPeerMessage(data)
            if (answer !== null) {
                sendWebrtcConn(this, answer)
            }
        })
    }

    /**
     * @param {WebrtcConn} peerConn
     * @param {Uint8Array} buf
     * @return {encoding.Encoder?}
     */
    readPeerMessage(buf) {
        log('received message from ', logging.BOLD, this.remotePeerId, logging.GREY, ' (', this.room.name, ')', logging.UNBOLD, logging.UNCOLOR)
        return this.room.readMessage(buf, () => {
            this.synced = true
            log('synced ', logging.BOLD, this.room.name, logging.UNBOLD, ' with ', logging.BOLD, this.remotePeerId)
            checkIsSynced(this.room)
        })
    }

    destroy() {
        this.peer.destroy()
    }
}


const messageSync = 0
const messageQueryAwareness = 3
const messageAwareness = 1


/**
 * @param {Room} room
 */
const checkIsSynced = room => {
    let synced = true
    room.webrtcConns.forEach(peer => {
        if (!peer.synced) {
            synced = false
        }
    })
    if ((!synced && room.synced) || (synced && !room.synced)) {
        room.synced = synced
        room.provider.emit('synced', [{synced}])
        log('synced ', logging.BOLD, room.name, logging.UNBOLD, ' with all peers')
    }
}


/**
 * @param {WebrtcConn} webrtcConn
 * @param {encoding.Encoder} encoder
 */
const sendWebrtcConn = (webrtcConn, encoder) => {
    log('send message to ', logging.BOLD, webrtcConn.remotePeerId, logging.UNBOLD, logging.GREY, ' (', webrtcConn.room.name, ')', logging.UNCOLOR)
    try {
        webrtcConn.peer.send(encoding.toUint8Array(encoder))
    } catch (e) {
    }
}

