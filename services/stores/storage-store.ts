// import {ItemStore} from "./item-store";
// import {Storage} from "@model";
// import {StorageJSON} from "@domain";
// import {ProxyProvider} from "../proxy-provider.service";
//
// export class StorageStore extends ItemStore<Storage, StorageJSON> {
//     constructor(private proxyProvider: ProxyProvider) {
//         super();
//     }
//
//     protected FromJSON(item: StorageJSON): Storage {
//         return {
//             URI: item.URI,
//             Type: item.Type,
//             Root: null,
//             id: this.getIdByURI(item.URI),
//             Trash: []
//         };
//     }
//
//     protected ToJSON(item: Storage): StorageJSON {
//         return {
//             URI: item.URI,
//             Type: item.Type,
//             Messages: [],
//             Contexts: []
//         };
//     }
//
//     protected CreateInDomain(item: Storage): Promise<string> {
//         const json = this.ToJSON(item);
//         throw new Error("Method not implemented.");
//     }
// }
