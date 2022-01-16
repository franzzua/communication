import {ContextStore} from "./contextStore";

export class StorageStore {
    private map = new Map<string, ContextStore>();
    //
    // private contextArray = this.doc.getArray<string>('contexts');

    // public State$ = merge(
    //     fromYjs(this.contextArray),
    //     from(this.IsLoaded$),
    // ).pipe(
    //     switchMap(x => this.GetAllStates$()),
    //     // tap(states => console.log(...states.map(x => x.Messages).filter(x => x.length))),
    //     map((states) => ({
    //         Contexts: states.map(x => x.Context),
    //         Messages: states.flatMap(x => x.Messages),
    //         URI: this.URI,
    //         Type: 'yjs'
    //     })),
    // )

    public Get(uri: string): ContextStore {
        return this.map.get(uri);
    }

    public Add(uri: string) {
        // this.contextArray.push([uri]);
        const store = new ContextStore(uri);
        this.map.set(uri, store);
        return store;
    }

    // private GetAllStates$() {
    //     if (this.contextArray.length == 0)
    //         return of([]);
    //     return combineLatest(this.contextArray.toArray().map(uri => {
    //         if (this.map.has(uri))
    //             return this.map.get(uri).State$;
    //         const store = new ContextStore(uri);
    //         this.map.set(uri, store);
    //         return store.State$;
    //     }));
    // }
    GetOrAdd(uri: string): ContextStore {
        return this.Get(uri) ?? this.Add(uri);
    }
}