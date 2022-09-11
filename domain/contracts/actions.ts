import {Context, Message} from "@model";


export type IMessageActions = {
    Attach(uri: string): Promise<void>;
    UpdateText(text: string): Promise<void>;
    Reorder(newOrder: number): Promise<void>;
    Move(fromURI: string, toURI: string, toIndex: number): Promise<void>;

    Remove(): Promise<void>;
}

export type IContextActions = {
    RemoveMessage(uri: string): Promise<void>;

    CreateMessage(message: Message, index?: number): Promise<void>;
}

export type IDomainActions = {
    // LoadContext(uri: string): Promise<void>;
    //
    CreateContext(context: Context): Promise<void>;
}

export interface IStorageActions {
    CreateMessage(message: Message): Promise<string>;

    CreateContext(context: Context): Promise<string>;

    Clear(): Promise<void>;
}


