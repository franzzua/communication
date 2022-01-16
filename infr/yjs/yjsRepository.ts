import {ContextJSON, MessageJSON, StorageJSON} from "@domain";
import {ContextStore} from "./contextStore";
import {StorageStore} from "@infr/yjs/storageStore";

export class YjsRepository  {
    private storageStore = new StorageStore();

    constructor() {
    }

    Contexts = {
        Create: (item: ContextJSON) => {
            const store = this.storageStore.Add(item.URI);
            store.UpdateContext(item);
        },
        Delete(item: ContextJSON) {
        },
        Update: (changes: Partial<ContextJSON>) => {
            const store = this.storageStore.Get(changes.URI);
            store.UpdateContext(changes);
        }
    }
    Messages = {
        Create: (item: MessageJSON) => {
            const store = this.storageStore.Get(item.ContextURI);
            store.AddMessage(item);
        },
        Delete: (item: MessageJSON) => {
            const store = this.storageStore.Get(item.ContextURI);
            store.DeleteMessage(item);
        },
        Update: (changes: Partial<MessageJSON>) => {
            const store = this.storageStore.Get(changes.ContextURI);
            store.UpdateMessage(changes);
        }
    }

    State$ = null;

    async Clear(): Promise<void> {
        ContextStore.clear()
    }

    LoadContext(uri: string): ContextStore {
        const store = this.storageStore.GetOrAdd(uri);
        return store;
    }

    //
    // LoadContext$(uri: string) {
    //     const store = this.storageStore.GetOrAdd(uri);
    //     return from(store.IsLoaded$.then(() => {
    //         const state = store.GetState();
    //         if (state.Context.CreatedAt)
    //             return state;
    //         return store.IsSynced$;
    //     })).pipe(
    //         switchMap(x => store.State$)
    //     );
    // }

    async Load(uri: string = null): Promise<StorageJSON> {
        return new Promise<StorageJSON>(r => ({}));
        // if (uri) {
        //     const store = this.storageStore.Add(uri)
        //     await store.IsSynced$;
        // }
        // await this.storageStore.IsLoaded$;
        // const state = await this.State$.pipe(
        //     first()
        // ).toPromise();
        // if (state.Contexts.length != 0) {
        //     return state;
        // } else {
        //     await this.storageStore.IsSynced$;
        //     return await this.State$.pipe(
        //         first()
        //     ).toPromise();
        // }
    }

}
