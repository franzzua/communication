import {AbstractType, Doc, YEvent} from "yjs";
import {IndexeddbPersistence} from "y-indexeddb";
import {Cell, Injectable} from "@cmmn/core";
import type {Observable} from "lib0/observable.js";

@Injectable()
export abstract class YjsStore {

    constructor(public URI: string) {
    }

    protected doc: Doc = new Doc({
        autoLoad: true,
        gc: true,
        guid: this.URI.split('/').pop(),
    });
    private indexeddbProvider = new IndexeddbPersistence(this.URI, this.doc);

    public IsLoaded$: Promise<void> = this.indexeddbProvider.whenSynced.then(() => {
    });
    public IsSynced$ = (async () => {
        const webRtcProvider = await this.GetRemoteProvider();
        return new Promise(resolve => webRtcProvider.once('connect', resolve))
    })().catch(console.error);

    abstract GetRemoteProvider(): Promise<Observable<any>>;
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
