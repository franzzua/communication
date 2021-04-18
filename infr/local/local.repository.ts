import {Injectable} from "@hypertype/core";
import {LocalStorage} from "@infr/local/local.storage";
import {IRepository} from "../../domain/contracts/repository";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

@Injectable()
export class LocalRepository implements IRepository {

    private storages = new Map<string, LocalStorage>();

    constructor() {
    }


    public async Init(storage: StorageJSON): Promise<{ contexts, messages }> {
        if (!this.storages.has(storage.URI)){
            const localStorage = new LocalStorage(storage.URI);
            await localStorage.Init();
            this.storages.set(storage.URI, localStorage);
        }
        const { messages, contexts } = await this.storages.get(storage.URI).Load();
        return { messages, contexts } ;
    }

    public async AddMessage(context: ContextJSON, message: MessageJSON): Promise<MessageJSON> {
        const localStorage = this.storages.get(context.StorageURI);
        const uri = await localStorage.AddMessage({
            ...message,
            ContextURI: context.URI
        });
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

}
