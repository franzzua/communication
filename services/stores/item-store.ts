// export abstract class ItemStore<TItem extends { URI; id; }, TJson extends { URI?; id?; }> {
//     public State = new Map<string, TItem>();
//     private uri2id = new Map<string, string>();
//
//
//     protected getIdByURI(uri: string) {
//         return this.uri2id.has(uri) ? this.uri2id.get(uri) : uri;
//     }
//
//     public getByURI(uri: string) {
//         const id = this.getIdByURI(uri);
//         return this.getById(id);
//     }
//
//     public getById(id: string) {
//         return this.State.has(id) ? this.State.get(id) : null;
//     }
//
//     public filter(selector: (item: TItem) => boolean){
//         return [...this.State.values()].filter(selector);
//     }
//
//
//     public async Create(item: TItem) {
//         this.State.set(item.id, item);
//         try {
//             item.URI =  await this.CreateInDomain(item);
//             this.uri2id.set(item.URI, item.id);
//         } catch (e) {
//             console.error(e);
//         }
//     }
//
//     public async Update(id: string, changes: Partial<TItem>){
//
//     }
//
//     public async Delete(id: string){
//
//     }
//
//     public SetOrUpdate(json: TJson): TItem {
//         const item = this.FromJSON(json);
//         if (this.State.has(item.id)) {
//             const oldItem = this.State.get(item.id);
//             Object.assign(oldItem, item);
//         } else {
//             this.State.set(item.id, item);
//         }
//         return item;
//     }
//
//     protected abstract ToJSON(item: TItem): TJson;
//
//     protected abstract FromJSON(item: TJson): TItem;
//
//     protected abstract CreateInDomain(item: TItem): Promise<string>;
// }
