import {Observable} from "lib0/observable.js";
import * as random from "lib0/random.js";
import {SignalingConnection} from "./signaling.connection";
import {Room} from "./room";
import * as awarenessProtocol from 'y-protocols/awareness'
import type {Options} from "simple-peer"
import {bind} from "@cmmn/core";
import {Cryptor} from "@infr/yjs/yWebRtc/cryptor";
import {SymmetricCryptor} from "@infr/yjs/yWebRtc/symmetric-cryptor";
import {AsIsCryptor} from "@infr/yjs/yWebRtc/as-is-cryptor";
import {Doc} from "yjs";

/**
 * @extends Observable<string>
 */
export class WebrtcProvider extends Observable<any> {

    static signalingConns = new Map<string, SignalingConnection>();
    signalingConns = new Set<SignalingConnection>();
    room: Room = null
    init$: Promise<void>;
    awareness = this.options.awareness ?? new awarenessProtocol.Awareness(this.doc);

    constructor(
        private roomName,
        public doc,
        public options: {
            signaling?: string[];
            password?: string;
            cryptor?: Cryptor;
            token?: string;
            awareness?: awarenessProtocol.Awareness;
            maxConns?: number;
            filterBcConns?: boolean;
            peerOpts?: Options
        } = {}
    ) {
        super();
        this.options = Object.assign({}, defaultOptions(doc), this.options);
        doc.on('destroy', this.destroy)
        this.init$ = this.init()
    }

    private async init() {
        this.signalingUrls.forEach(url => {
            const signalingConn = WebrtcProvider.signalingConns.getOrAdd(url, url => new SignalingConnection(url))
            this.signalingConns.add(signalingConn);
            signalingConn.providers.add(this)
        })
        const cryptor = this.getCryptor();
        this.room = Room.Open(this.doc, this, this.roomName, cryptor, this.options.token);
        this.room.connect()
    }

    private getCryptor(): Cryptor {
        if (this.options.cryptor)
            return this.options.cryptor;
        if (this.options.password)
            return new SymmetricCryptor(this.options.password, this.roomName);
        return new AsIsCryptor();
    }

    get signalingUrls() {
        return this.options.signaling
    }

    /**
     * @type {boolean}
     */
    get connected() {
        return this.room !== null;
    }

    disconnect() {
        this.signalingConns.forEach(conn => {
            conn.providers.delete(this)
            if (conn.providers.size === 0) {
                conn.destroy()
                WebrtcProvider.signalingConns.delete(conn.url)
            }
        })
        if (this.room) {
            this.room.disconnect()
        }
    }

    @bind
    destroy() {
        this.disconnect();
        this.doc.off('destroy', this.destroy)
        // need to wait for key before deleting room
        this.init$.then(() => {
            /** @type {Room} */ (this.room).disconnect()
            Room.Rooms.delete(this.roomName)
        })
        super.destroy()
    }
}

const defaultOptions = doc => ({
    signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'],
    password: null,
    token: null,
    awareness: new awarenessProtocol.Awareness(doc),
    maxConns: 20 + Math.floor(random.rand() * 15), // the random factor reduces the chance that n clients form a cluster
    filterBcConns: true,
    peerOpts: {} // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts
});