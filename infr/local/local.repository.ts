import {Injectable, Observable, of, Subject} from "@hypertype/core";
import {LocalStorage} from "@infr/local/local.storage";
import {IRepository} from "../../domain/contracts/repository";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

@Injectable(true)
export class LocalRepository implements IRepository {

    protected storages = new Map<string, LocalStorage>();

    constructor() {
    }

    public async Load(storageURI: string): Promise<StorageJSON> {
        if (!this.storages.has(storageURI)){
            const localStorage = await this.CreateStorage(storageURI);
        }
        const json = await this.storages.get(storageURI).Load();
        return json;
    }
    protected async CreateStorage(storageURI: string): Promise<LocalStorage>{
        const localStorage = new LocalStorage(storageURI);
        await localStorage.Init();
        this.storages.set(storageURI, localStorage);
        const json = await localStorage.Load();
        this.stateSubject$.next(json);
        return localStorage;
    }

    public Contexts = {
        Create: async (context: ContextJSON) =>{
            const localStorage = this.storages.get(context.StorageURI);
            await localStorage.AddContext(context);
        },
        Update: async (changes: Partial<ContextJSON>) =>{
            const localStorage = this.storages.get(changes.StorageURI);
            await localStorage.UpdateContext(changes.id, changes);
        },
        Delete: async (context: ContextJSON) =>{
            const localStorage = this.storages.get(context.StorageURI);
            await localStorage.RemoveContext(context);
        }
    }

    public Messages = {
        Create: async (message: MessageJSON) => {
            const localStorage = this.storages.get(message.StorageURI);
            await localStorage.AddMessage(message);
        },
        Update: async (changes: Partial<MessageJSON>) => {
            const localStorage = this.storages.get(changes.StorageURI);
            await localStorage.UpdateMessage(changes.id, changes);
        },
        Delete: async (message: MessageJSON) => {
            const localStorage = this.storages.get(message.StorageURI);
            await localStorage.RemoveMessage(message);
        }
    }


    public async GetStorages(): Promise<StorageJSON[]>{
        const result = [] as StorageJSON[];
        const storages = await LocalStorage.getAllDatabases();
        for (let storage of storages) {
            const json = await storage.Load();
            this.storages.set(storage.URI, storage);
            result.push(json);
        }
        return result;
    }

    public async Clear(): Promise<void> {
        for (let storage of this.storages.values()) {
            await storage.Clear();
        }
    }

    protected stateSubject$ = new Subject<StorageJSON>();
    public State$ = this.stateSubject$.asObservable();
}
