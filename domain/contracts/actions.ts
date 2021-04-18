import {Context, Message} from "@model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

export interface IContextActions {
    AddMessage(message: MessageJSON);
}

export interface IDomainActions {
    CreateStorage(storage: StorageJSON): Promise<any>;
}

export interface IStorageActions {
    CreateContext(context: ContextJSON);
}
