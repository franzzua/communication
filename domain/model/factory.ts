import {Context, Message, Storage} from "@model";
import {Container, Injectable} from "@hypertype/core";
import {ContextModel} from "./context-model";
import {DomainModel} from "./domain-model";
import {StorageModel} from "./storage-model";
import {LocalStorageModel} from "./local-storage.model";
import {IFactory} from "./i-factory";
import {MessageModel} from "@domain/model/message-model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

@Injectable()
export class Factory extends IFactory {

    private MessageMap = new Map<string, MessageModel>();
    private ContextMap = new Map<string, ContextModel>();
    private StorageMap = new Map<string, StorageModel>();

    constructor(private container: Container) {
        super();
    }

    public GetOrCreateMessage(state: MessageJSON, storage: StorageModel): MessageModel {
        if (this.MessageMap.has(state.URI))
            return this.MessageMap.get(state.URI);
        const message = this.container.get<MessageModel>(MessageModel);
        message.Storage = storage;
        message.FromJSON(state);
        this.MessageMap.set(state.URI, message);
        return message;
    }

    public GetOrCreateStorage(state: StorageJSON, domain: DomainModel): StorageModel {
        if (this.StorageMap.has(state.URI))
            return this.StorageMap.get(state.URI);
        let storage: StorageModel;
        switch (state.Type) {
            case 'local':
                storage = this.container.get<LocalStorageModel>(LocalStorageModel);
        }
        storage.FromJSON(state, domain);
        this.StorageMap.set(state.URI, storage);
        return storage;
    }

    public GetOrCreateContext(state: ContextJSON, storage: StorageModel): ContextModel {
        if (this.ContextMap.has(state.URI))
            return this.ContextMap.get(state.URI);
        const context = this.container.get<ContextModel>(ContextModel);
        context.FromJSON(state, storage);
        this.ContextMap.set(state.URI, context);
        return context;
    }


    public GetStorage(uri: string): StorageModel{
        return this.StorageMap.get(uri);
    }

    public GetContext(uri: string): ContextModel{
        return this.ContextMap.get(uri);
    }
    public GetMessage(uri: string): MessageModel{
        return this.MessageMap.get(uri);
    }
}

