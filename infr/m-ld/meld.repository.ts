import {Injectable, Observable, of, Subject} from "@hypertype/core";
import {IRepository} from "@domain";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

import * as h from "@hypertype/core";
import {StorageStore} from "@infr/m-ld/storage.store";
import {ContextStore} from "@infr/m-ld/context.store";
import {MeldFactory} from "@infr/m-ld/meld.factory";

@Injectable(true)
export class MeldRepository implements IRepository {

    private meld = MeldFactory.GetMeldClone('default');

    public Init$ = this.meld.then(meld => new StorageStore(this.storageURI, meld));
    private store!: StorageStore;
    private ContextStores = new Map<string, ContextStore>();

    constructor(private storageURI: string) {
    }


    public async Load(): Promise<StorageJSON> {
        this.store = await this.Init$;
        const contexts = await this.store.GetContexts();
        const messages = [];
        for (let context of contexts) {
            const contextStore = await this.getContextStore(context.URI, false);
            const msgs = await contextStore.GetMessages();
            messages.push(...msgs);
        }
        return {
            Contexts: contexts,
            Messages: messages,
            URI: this.store.URI,
            Type: 'local'
        };
    }

    private async getContextStore(uri, isNew: boolean | null){
        if (!this.ContextStores.has(uri)){
            const meld = await  this.meld;
            const contextStore = new ContextStore(uri, meld);
            this.ContextStores.set(uri, contextStore);
        }
        return this.ContextStores.get(uri);
    }

    public Contexts = {
        Create: async (context: ContextJSON) =>{
            await this.store.CreateContext(context);
            await this.getContextStore(context.URI, true);
            // this.ContextStores.set(context.URI, contextStore);
        },
        Update: async (changes: Partial<ContextJSON>) =>{
            await this.store.UpdateContext(changes);
        },
        Delete: async (context: ContextJSON) =>{
        }
    }

    public Messages = {
        Create: async (message: MessageJSON) => {
            const contextStore = await this.getContextStore(message.ContextURI, false);
            await contextStore.AddMessage(message);
        },
        Update: async (changes: Partial<MessageJSON>) => {
            const contextStore = await this.getContextStore(changes.ContextURI, false);
            await contextStore.UpdateMessage(changes);
        },
        Delete: async (message: MessageJSON) => {
            const contextStore = await this.getContextStore(message.ContextURI, false);
            await contextStore.DeleteMessage(message);
        }
    }


    public async Clear(): Promise<void> {
    }

    protected stateSubject$ = new Subject<StorageJSON>();
    public State$ = h.from(this.Init$).pipe(
        h.concatMap(x => this.Load())
    )
}
