import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import {CRD} from "@domain/sync/item-sync";
import {first, Observable, utc} from "@hypertype/core";
import {ContextStore} from "./contextStore";
import {StorageStore} from "@infr/y/storageStore";

export class YRepository implements IRepository {
    private storageStore = new StorageStore(this.uri);

    constructor(private uri) {
    }

    Contexts: CRD<ContextJSON> = {
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
    Messages: CRD<MessageJSON> = {
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

    State$: Observable<StorageJSON> = this.storageStore.State$;

    async Clear(): Promise<void> {
        ContextStore.clear()
    }

    async Load(): Promise<StorageJSON> {
        await this.storageStore.IsLoaded$;
        return this.State$.pipe(
            first()
        ).toPromise();
    }

}
