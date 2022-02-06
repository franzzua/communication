import * as logging from "lib0/logging";
import {log} from "./y-webrtc";
import SimplePeer from "simple-peer/simplepeer.min.js"
import {Room} from "@infr/yjs/yWebRtc/room";
import {SignalingConnection} from "@infr/yjs/yWebRtc/signaling.connection";
import {bind} from "@cmmn/core";

export class WebrtcConnection {
    private closed = false;
    private connected = false;
    private synced = false;
    public peer = new SimplePeer({
        initiator: this.initiator,
        ...this.room.provider.options.peerOpts
    });

    /**
     * @param {SignalingConnection} signalingConn
     * @param {boolean} initiator
     * @param {string} remotePeerId
     * @param {Room} room
     */
    constructor(private signalingConn: SignalingConnection, private initiator: boolean, private remotePeerId, private room: Room) {
        log('establishing connection to ', logging.BOLD, remotePeerId)
        /**
         * @type {any}
         */
        this.peer.on('signal', this.onSignal)
        this.peer.on('connect', this.onConnect)
        this.peer.on('close', () => {
            this.connected = false
            this.closed = true
            if (room.webrtcConns.has(this.remotePeerId)) {
                room.webrtcConns.delete(this.remotePeerId)
                this.room.emitPeersChanged( [], [this.remotePeerId]);
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
        this.peer.on('data', async encrypted => {
            const data = await this.room.cryptor.decrypt(encrypted);
            const answer = this.getAnswer(data)
            answer && this.send(answer)
        });
    }

    @bind
    private async onSignal(signal) {
        this.signalingConn.send(await this.room.getSignalingMessage({
            to: this.remotePeerId,
            from: this.room.peerId,
            type: 'signal',
            signal
        }));
    }

    @bind
    private async onConnect() {
        log('connected to ', logging.BOLD, this.remotePeerId)
        this.connected = true
        // send sync step 1
        this.send(this.room.serializer.getSync1Message());
        this.send(this.room.serializer.getAwarenessMessage());

        this.room.emitPeersChanged( [this.remotePeerId], []);
    }

    /**
     * @param {WebrtcConnection} peerConn
     * @param {Uint8Array} buf
     * @return {encoding.Encoder?}
     */
    getAnswer(buf): Uint8Array | void {
        log('received message from ', logging.BOLD, this.remotePeerId, logging.GREY, ' (', this.room.name, ')', logging.UNBOLD, logging.UNCOLOR)
        return this.room.getAnswer(buf, () => {
            this.synced = true
            log('synced ', logging.BOLD, this.room.name, logging.UNBOLD, ' with ', logging.BOLD, this.remotePeerId)
            checkIsSynced(this.room)
        })
    }

    destroy() {
        this.peer.destroy()
    }

    public async send(m: Uint8Array) {
        const encrypted = await this.room.cryptor.encrypt(m);
        this.peer.send(encrypted);
    }
}


// const messageSync = 0
// const messageQueryAwareness = 3
// const messageAwareness = 1


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

