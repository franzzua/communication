// import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
// import {Change, ChangesStorage} from "@infr/changes-storage";
// import {award} from "rdf-namespaces/dist/schema";
// import { ulid } from "ulid";
//
// export class PromiseQueue {
//
//     private changesStorage = new ChangesStorage();
//
//     constructor(private main: IRepository) {
//     }
//
//     private queue: (() => Promise<void>)[] = [];
//     private isInvoking = false;
//
//     private Invoke() {
//         if (this.isInvoking || this.queue.length == 0)
//             return;
//         this.isInvoking = true;
//         const current = this.queue.shift();
//         current().finally(() => {
//             this.isInvoking = false;
//             this.Invoke();
//         });
//     }
//
//     private init$ = this.changesStorage.Init();
//
//     public async add(method: keyof IRepository, args) {
//         const change = {
//             Action: method,
//             ulid: ulid(),
//             //add storage uri
//             Entity: args,
//         } as Change;
//         await this.changesStorage.Add(change);
//         return this.applyChange(change);
//     }
//     private applyChange(change: Change){
//         return new Promise<any>((resolve, reject) => {
//             this.queue.push(async () => {
//                 try {
//                     // this.FixArgs(change.Action, change.Args);
//                     const res = await this.main[change.Action](change.Entity as any);
//                     console.log('invoked', change.Action, change.ulid);
//                     // this.FixResult(change.Action, change.Args, res);
//                     change.ulid && await this.changesStorage.Remove(change.ulid);
//                     resolve(res);
//                 } catch (e) {
//                     change.ulid && await this.changesStorage.Remove(change.ulid);
//                     reject(e);
//                 }
//             });
//             this.Invoke();
//         });
//     }
//
//     public async Load(storage: string): Promise<void> {
//         this.isInvoking = true;
//         await this.main.Load(storage);
//         const changes = await this.changesStorage.GetAll();
//         if (changes.length != 0) {
//             changes.forEach(x => this.applyChange(x));
//         }
//         this.isInvoking = false;
//         this.Invoke();
//     }
//
// }
