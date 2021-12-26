import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {Observable} from "@hypertype/core";
import {CRD} from "@domain/sync/item-sync";

export interface IRepository {

    State$: Observable<StorageJSON>;

    Load(contextURI?): Promise<StorageJSON>;

    Contexts: CRD<ContextJSON>;
    Messages: CRD<MessageJSON>;
    //
    // CreateContext(context: ContextJSON): Promise<void>;
    //
    // RemoveContext(context: ContextJSON): Promise<void>;
    //
    // AddMessage( message: MessageJSON): Promise<void>;

    Clear(): Promise<void>;
    //
    // UpdateMessage(msg: MessageJSON): Promise<void>;
    //
    // RemoveMessage(msg: MessageJSON): Promise<void>;
    //
    // UpdateContext(ctx: ContextJSON): Promise<void>;

}
