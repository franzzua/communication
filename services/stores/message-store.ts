// import {ItemStore} from "./item-store";
// import {Context, Message, Storage} from "@model";
// import {ContextJSON, MessageJSON, StorageJSON} from "@domain";
// import {ProxyProvider} from "../proxy-provider.service";
// import { utc } from "@hypertype/core";
//
// export class MessageStore extends ItemStore<Message, MessageJSON> {
//
//     constructor(private storages: ItemStore<Storage, StorageJSON>,
//                 private contextStore: ItemStore<Context, ContextJSON>,
//                 private proxyProvider: ProxyProvider) {
//         super();
//     }
//
//     protected FromJSON(m: MessageJSON): Message {
//         const result = {
//             Content: m.Content,
//             URI: m.URI,
//             Description: m.Description,
//             CreatedAt: utc(m.CreatedAt),
//             UpdatedAt: utc(m.UpdatedAt),
//             id: this.getIdByURI(m.URI),
//             Context: this.contextStore.getByURI(m.ContextURI),
//             SubContext: m.SubContextURI ? this.contextStore.getByURI(m.SubContextURI) : null,
//         };
//         result.Context && result.Context.Messages.push(result);
//         result.SubContext && result.SubContext.Parents.push(result);
//         return result;
//     }
//
//     protected ToJSON(m: Message): MessageJSON {
//         return {
//             Content: m.Content,
//             URI: m.URI,
//             id: m.id,
//             Description: m.Description,
//             CreatedAt: m.CreatedAt.toISO(),
//             UpdatedAt: m.UpdatedAt?.toISO(),
//             StorageURI: m.Context.Storage.URI,
//             ContextURI: m.Context.URI,
//             SubContextURI: m.SubContext?.URI,
//             AuthorURI: m.Author?.URI
//         };
//     }
//
//     protected async CreateInDomain(item: Message): Promise<string> {
//         const json = this.ToJSON(item);
//         const proxy = await this.proxyProvider.GetContextProxy(item.Context);
//         const uri = await proxy.Actions.AddMessage(json);
//         return uri;
//     }
// }
