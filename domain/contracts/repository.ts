import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {CRD} from "@domain/sync/item-sync";

export interface IRepository {
    Init(storage: StorageJSON): Promise<StorageJSON>;

    CreateContext(context: ContextJSON): Promise<ContextJSON>;

    AddMessage( message: MessageJSON): Promise<MessageJSON>;

    Clear(): Promise<void>;

    UpdateMessage(msg: MessageJSON): Promise<void>;

    RemoveMessage(msg: MessageJSON): Promise<void>;

    UpdateContext(ctx: ContextJSON): Promise<void>;

}
