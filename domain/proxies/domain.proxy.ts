import {ModelProxy} from "@hypertype/domain";
import {ContextJSON, DomainJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {IContextActions, IDomainActions, IMessageActions, IStorageActions} from "@domain/contracts/actions";
import { Fn } from "@hypertype/core";

export class DomainProxy extends ModelProxy<DomainJSON, IDomainActions>{

    @Fn.cache()
    public GetStorageProxy(uri: string){
        return this.GetSubProxy(StorageProxy, 'Storages', uri) as StorageProxy;
    }
}

export class StorageProxy extends ModelProxy<StorageJSON, IStorageActions>{

    @Fn.cache()
    public GetContextProxy(uri: string){
        return this.GetSubProxy(ModelProxy, 'Contexts', uri) as ModelProxy<ContextJSON, IContextActions>;
    }

    @Fn.cache()
    public GetMessageProxy(uri: string){
        return this.GetSubProxy(ModelProxy, 'Messages', uri) as ModelProxy<MessageJSON, IMessageActions>;
    }
}
