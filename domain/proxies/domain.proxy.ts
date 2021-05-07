import {ModelProxy} from "@hypertype/domain";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
import {IContextActions, IDomainActions, IMessageActions, IStorageActions} from "@domain/contracts/actions";
import { Fn } from "@hypertype/core";
import {DomainState, Storage} from "@model";


export class DomainProxy extends ModelProxy<DomainState, IDomainActions>{

    @Fn.cache()
    public GetStorageProxy(uri: string){
        return this.GetSubProxy(StorageProxy, 'Storages', uri) as StorageProxy;
    }
}

export class StorageProxy extends ModelProxy<Storage, IStorageActions>{

    @Fn.cache()
    public GetContextProxy(uri: string){
        return this.GetSubProxy(ModelProxy, 'Contexts' as any, uri) as ModelProxy<ContextJSON, IContextActions>;
    }

    @Fn.cache()
    public GetMessageProxy(uri: string){
        return this.GetSubProxy(ModelProxy, 'Messages' as any, uri) as ModelProxy<MessageJSON, IMessageActions>;
    }
}
