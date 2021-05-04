import {Context, Message} from "@model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {StorageModel} from "@domain/model";


export interface IMessageActions {
    Attach(uri: string): Promise<void>;
    UpdateText(text: string): Promise<void>;
    Reorder(newOrder: number): Promise<void>;
    Move(fromURI: string, toURI: string, toIndex: number): Promise<void>;
}

export interface IContextActions {
    AddMessage(message: MessageJSON): Promise<string>;

    RemoveMessage(uri: string): Promise<void>;
}

export interface IDomainActions {
    CreateStorage(storage: StorageJSON): Promise<StorageModel>;
}

export interface IStorageActions {
    CreateContext(context: ContextJSON): Promise<string>;

    Clear(): Promise<void>;
}

