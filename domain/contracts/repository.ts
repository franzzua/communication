import {Storage} from "@model";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

export interface IRepository {
    Init(storage: StorageJSON): Promise<{messages: MessageJSON[], contexts: ContextJSON[]}>;

    CreateContext(context: ContextJSON): Promise<ContextJSON>;

    AddMessage(context: ContextJSON, message: MessageJSON): Promise<MessageJSON>;

    Clear(): void;

    UpdateMessage(msg: MessageJSON): Promise<void>;

}
