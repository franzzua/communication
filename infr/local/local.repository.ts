import {Injectable, Observable, of, Subject} from "@hypertype/core";
import {LocalStorage} from "@infr/local/local.storage";
import {IRepository} from "../../domain/contracts/repository";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

import * as h from "@hypertype/core";

@Injectable(true)
export class LocalRepository implements IRepository {

    protected localStorage = new LocalStorage(this.storageURI);
    public Init$ = this.localStorage.Init();

    constructor(private storageURI: string, private dbname = storageURI.substr('local://'.length)) {
    }


    public async Load(): Promise<StorageJSON> {
        await this.Init$;
        return this.localStorage.Load();
    }

    public Contexts = {
        Create: async (context: ContextJSON) =>{
            await this.localStorage.AddContext(context);
        },
        Update: async (changes: Partial<ContextJSON>) =>{
            await this.localStorage.UpdateContext(changes.id, changes);
        },
        Delete: async (context: ContextJSON) =>{
            await this.localStorage.RemoveContext(context);
        }
    }

    public Messages = {
        Create: async (message: MessageJSON) => {
            await this.localStorage.AddMessage(message);
        },
        Update: async (changes: Partial<MessageJSON>) => {
            await this.localStorage.UpdateMessage(changes.id, changes);
        },
        Delete: async (message: MessageJSON) => {
            await this.localStorage.RemoveMessage(message);
        }
    }


    public async Clear(): Promise<void> {
        await this.localStorage.Clear();
    }

    protected stateSubject$ = new Subject<StorageJSON>();
    public State$ = h.from(this.Init$).pipe(
        h.concatMap(x => this.Load())
    )
}
