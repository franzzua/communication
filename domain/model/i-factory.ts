import {Context, Message, Storage} from "@model";
import {DomainModel} from "./domain-model";
import {StorageModel} from "./storage-model";
import {ContextModel} from "./context-model";
import {MessageModel} from "@domain/model/message-model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

export abstract class IFactory {
    public abstract GetStorage(uri: string): StorageModel;

    public abstract GetContext(uri: string): ContextModel;

    public abstract GetMessage(uri: string): MessageModel;

    public abstract GetOrCreateStorage(state: Storage, domain: DomainModel): StorageModel;

    public abstract GetOrCreateContext(state: Context, storage: StorageModel): ContextModel;

    public abstract GetOrCreateMessage(state: Message, storage: StorageModel): MessageModel;
}
