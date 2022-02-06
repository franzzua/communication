import {Instance, Options, SignalData} from "simple-peer";
import SimplePeer from "simple-peer/simplepeer.min.js"
import {Observable} from "lib0/observable";
import {UserInfo} from "../shared/types";

export class PeerConnection extends Observable<any> {


    private constructor(private peer: Instance) {
        super();
        peer.on('signal', data => this.emit('signal', [data]));
    }

    public static answer(user: UserInfo, signal: SignalData, options: Options) {
        const peer: Instance = new SimplePeer({
            initiator: false,
            ...options
        });
        peer.signal(signal);
        return new PeerConnection(peer);
    }

    public static initiate(user: UserInfo, peerOpts: SimplePeer.Options) {
        const peer: Instance = new SimplePeer({
            initiator: true,
            ...peerOpts
        });
        return new PeerConnection(peer);
    }
}