// import {ModelProxy} from "@hypertype/domain";
// import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";
// import {IContextActions, IDomainActions, IMessageActions, IStorageActions} from "@domain/contracts/actions";
// import { Fn } from "@hypertype/core";
// import {DomainState, Storage} from "@model";
//
//
// export class DomainProxy extends ModelProxy<DomainState, IDomainActions>{
//
//     @Fn.cache()
//     public GetContextProxy(uri: string){
//         return this.GetSubProxy(ContextProxy, 'Contexts' as any, uri) as ContextProxy;
//     }
// }
//
// export class ContextProxy extends ModelProxy<ContextJSON, IContextActions>{
//
//
//     @Fn.cache()
//     public GetMessageProxy(uri: string){
//         return this.GetSubProxy(ModelProxy, 'Messages' as any, uri) as ModelProxy<MessageJSON, IMessageActions>;
//     }
// }
