// import {ItemStore} from "./item-store";
// import {Context, Message, Sorting, Storage} from "@model";
// import {ContextJSON, MessageJSON, StorageJSON} from "@domain";
// import {ProxyProvider} from "../proxy-provider.service";
// import { Permutation } from "@domain/helpers/permutation";
//
// export class ContextStore extends ItemStore<Context, ContextJSON> {
//     constructor(private storages: ItemStore<Storage, StorageJSON>,
//                 private proxyProvider: ProxyProvider) {
//         super();
//     }
//
//     protected FromJSON(c: ContextJSON): Context {
//         const storage = this.storages.getByURI(c.StorageURI);
//         const result = {
//             Storage: storage,
//             URI: c.URI,
//             id: this.getIdByURI(c.URI),
//             Sorting: Sorting[c.Sorting] as Sorting,
//             Permutation: Permutation.Parse(c.Permutation),
//             Messages: [],
//             Parents: []
//         };
//         // result.Parents.forEach(p => p.SubContext = result);
//         // result.Messages.forEach(p => p.Context = result);
//         if (c.IsRoot)
//             storage.Root = result;
//         // else if (c.ParentsURIs.length == 0)
//         //     storage.Trash.push(result);
//         return result;
//     }
//
//     protected ToJSON(c: Context): ContextJSON {
//         return {
//             StorageURI: c.Storage.URI,
//             URI: c.URI,
//             id: c.id,
//             Sorting: Sorting[c.Sorting],
//             Permutation: c.Permutation?.toString(),
//             // MessageURIs: c.Messages.map(m => m.URI),
//             // ParentsURIs: c.Parents.map(m => m.URI)
//         };
//     }
//
//     protected async CreateInDomain(item: Context): Promise<string> {
//         const json = this.ToJSON(item);
//         const proxy = await this.proxyProvider.GetStorageProxy(item.Storage);
//         return proxy.Actions.CreateContext(json);
//     }
// }
