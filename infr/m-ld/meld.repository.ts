import {Injectable, Observable, of, Subject} from "@hypertype/core";
import {IRepository} from "@domain";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

import * as h from "@hypertype/core";
import {MeldStore} from "@infr/m-ld/meldStore";
import {MeldFactory} from "@infr/m-ld/meld.factory";

@Injectable(true)
export class MeldRepository implements IRepository {

    private meld = MeldFactory.GetMeldClone('default');

    public Init$ = this.meld.then(meld => new MeldStore(this.storageURI, meld));
    private store!: MeldStore;

    constructor(private storageURI: string) {
    }


    public async Load(): Promise<StorageJSON> {
        this.store = await this.Init$;
        const contexts = await this.store.GetContexts();
        const messages = [];
        for (let context of contexts) {
            const msgs = await this.store.GetMessages(context.URI);
            messages.push(...msgs);
        }
        return {
            Contexts: contexts,
            Messages: messages,
            URI: this.store.URI,
            Type: 'local'
        };
    }

    public Contexts = {
        Create: async (context: ContextJSON) =>{
            await this.store.CreateContext(context);
        },
        Update: async (changes: Partial<ContextJSON>) =>{
            await this.store.UpdateContext(changes);
        },
        Delete: async (context: ContextJSON) =>{
        }
    }

    public Messages = {
        Create: async (message: MessageJSON) => {
            await this.store.AddMessage(message);
        },
        Update: async (changes: Partial<MessageJSON>) => {
            await this.store.UpdateMessage(changes);
        },
        Delete: async (message: MessageJSON) => {
            await this.store.DeleteMessage(message);
        }
    }


    public async Clear(): Promise<void> {
    }

    protected stateSubject$ = new Subject<StorageJSON>();
    public State$ = h.from(this.Init$).pipe(
        h.concatMap(x => this.Load())
    )
}
