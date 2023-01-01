import {Context, Message} from "@model";


export type IMessageActions = {
    Attach(uri: string): Promise<void>;
    UpdateText(text: string): Promise<void>;
    Reorder(newOrder: number): Promise<void>;
    Move(fromURI: string, toURI: string, toIndex: number): Promise<void>;

    CreateSubContext(uri: string, parentURI: string): Promise<void>;
    Remove(): Promise<void>;
}

export type IContextActions = {
    RemoveMessage(uri: string): Promise<void>;

    CreateMessage(message: Message, index?: number): Promise<void>;
}

export type IDomainActions = {
    // LoadContext(uri: string): Promise<void>;
    //
}

export interface IStorageActions {
    CreateMessage(message: Message): Promise<string>;

    CreateContext(context: Context): Promise<string>;

    Clear(): Promise<void>;
}


