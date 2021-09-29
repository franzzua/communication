import {Context, Message, Storage} from "@model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {StorageModel} from "@domain/model";


export interface IMessageActions {
    Attach(uri: string, time: string): Promise<void>;
    UpdateText(text: string, time: string): Promise<void>;
    Reorder(newOrder: number, time: string): Promise<void>;
    Move(fromURI: string, toURI: string, toIndex: number, time: string): Promise<void>;
}

export interface IContextActions {
    RemoveMessage(uri: string, time: string): Promise<void>;
}

export interface IDomainActions {
    CreateStorage(storage: Storage): Promise<Storage>;
}

export interface IStorageActions {
    CreateMessage(message: Message, time: string): Promise<string>;
    CreateContext(context: Context, time: string): Promise<string>;

    Clear(): Promise<void>;
}

