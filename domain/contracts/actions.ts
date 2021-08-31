import {Context, Message, Storage} from "@model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {StorageModel} from "@domain/model";


export interface IMessageActions {
    Attach(uri: string): Promise<void>;
    UpdateText(text: string): Promise<void>;
    Reorder(newOrder: number): Promise<void>;
    Move(fromURI: string, toURI: string, toIndex: number): Promise<void>;
}

export interface IContextActions {
    RemoveMessage(uri: string): Promise<void>;
}

export interface IDomainActions {
    CreateStorage(storage: Storage): Promise<Storage>;
}

export interface IStorageActions {
    CreateMessage(message: Message): Promise<string>;
    CreateContext(context: Context): Promise<string>;

    Clear(): Promise<void>;
}

