import {Context, Message, Storage} from "@model";


export interface IMessageActions {
    Attach(uri: string): Promise<void>;
    UpdateText(text: string): Promise<void>;
    Reorder(newOrder: number): Promise<void>;
    Move(fromURI: string, toURI: string, toIndex: number): Promise<void>;
}

export interface IContextActions {
    RemoveMessage(uri: string): Promise<void>;

    CreateMessage(message: Message): Promise<void>;
}

export interface IDomainActions {
    LoadContext(uri: string): Promise<void>;

    CreateContext(context: Context): Promise<void>;
}

export interface IStorageActions {
    CreateMessage(message: Message): Promise<string>;
    CreateContext(context: Context): Promise<string>;

    Clear(): Promise<void>;
}


