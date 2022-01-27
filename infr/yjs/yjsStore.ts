import {AbstractType, Doc, YEvent} from "yjs";
import {IndexeddbPersistence} from "y-indexeddb";
import {Cell} from "@cmmn/core";
import {WebrtcProvider} from "./yWebRtc";

export class YjsStore {

    protected doc: Doc = new Doc({
        autoLoad: true,
        gc: true,
        guid: this.URI.split('/').pop(),
    });
    private indexeddbProvider = new IndexeddbPersistence(this.URI, this.doc);

    public IsLoaded$: Promise<void> = this.indexeddbProvider.whenSynced.then(() => {
    });
    public IsSynced$ = (async () => {
        const request = await fetch('/api/context?uri=' + this.URI, {
            headers: {
                'authorization': JSON.stringify({user: 'andrey'})
            }
        });
        const token = request.ok && request.headers.get('ResourceToken');
        const webRtcProvider = new WebrtcProvider(this.URI, this.doc, {
            signaling: [`${location.origin.replace(/^http/,'ws')}/api`],
            // If password is a string, it will be used to encrypt all communication over the signaling servers.
            // No sensitive information (WebRTC connection info, shared data) will be shared over the signaling servers.
            // The main objective is to prevent man-in-the-middle attacks and to allow you to securely use public / untrusted signaling instances.
            password: 'very secure password',
            token,
            // Specify an existing Awareness instance - see https://github.com/yjs/y-protocols
            // awareness: new awarenessProtocol.Awareness(doc),
            maxConns: 70 + Math.floor(Math.random() * 70),
            filterBcConns: true,
            peerOpts: {}
        } as any);
        return new Promise(resolve => webRtcProvider.once('connect', resolve))
    })();

    public constructor(public URI: string) {
        // this.webRtcProvider.connect();
    }


    protected subscribe(shared: AbstractType<YEvent>) {

    }
}

export function fromYjs(shared: AbstractType<YEvent>) {
    const cell = new Cell(null);
    const listener = (events, transaction) => {
        if (transaction.local)
            return;
        cell.set(events);
    };
    shared.observeDeep(listener);
    return cell;
}
