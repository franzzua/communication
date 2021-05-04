import {Injectable} from "@hypertype/core";
import {LocalStorage} from "@infr/local/local.storage";
import {IRepository} from "../../domain/contracts/repository";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

@Injectable(true)
export class LocalRepository implements IRepository {

    private storages = new Map<string, LocalStorage>();
    public IsBack: boolean;

    constructor() {
    }

    public async Init(storage: StorageJSON): Promise<StorageJSON> {
        // await this.GetStorages();
        if (!this.storages.has(storage.URI)){
            const localStorage = new LocalStorage(storage.URI);
            await localStorage.Init();
            this.storages.set(storage.URI, localStorage);
        }
        const json = await this.storages.get(storage.URI).Load();
        return json;
    }

    public async AddMessage(message: MessageJSON): Promise<MessageJSON> {
        const localStorage = this.storages.get(message.StorageURI);
        const uri = await localStorage.AddMessage(message);
        return {
            ...message,
            URI: uri
        };
    }

    public async CreateContext(context: ContextJSON): Promise<ContextJSON> {
        const localStorage = this.storages.get(context.StorageURI);
        const uri = await localStorage.AddContext(context);
        return {
            ...context,
            URI: uri
        }
    }

    public async Clear(): Promise<void> {
        for (let storage of this.storages.values()) {
            await storage.Clear();
        }
    }

    public async UpdateMessage(msg: MessageJSON): Promise<void> {
        const localStorage = this.storages.get(msg.StorageURI);
        await localStorage.UpdateMessage(msg);
    }
    public async UpdateContext(ctx: ContextJSON): Promise<void> {
        const localStorage = this.storages.get(ctx.StorageURI);
        await localStorage.UpdateContext(ctx);
    }

    public async RemoveMessage(msg: MessageJSON): Promise<void> {
        const localStorage = this.storages.get(msg.StorageURI);
        await localStorage.RemoveMessage(msg);
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

}
