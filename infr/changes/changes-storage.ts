import {ContextJSON, IRepository, MessageJSON} from "@domain";
import {open} from "db.js";

export class ChangesStorage {

    private db: DbJs.Server & {
        changes: DbJs.TypedObjectStoreServer<Change>;
    };


    public async Init(){
        this.db = await open({
            server: 'changes',
            version: 1,
            schema: {
                changes: {
                    key: {keyPath: 'ulid'},
                },
            }
        }) as any;
    }

    public async Add<TJson extends MessageJSON | ContextJSON>(change: TChange<TJson>): Promise<void>{
        await this.db.changes.add(change as Change);
    }

    public async GetAll(): Promise<Change[]> {
        const allChanges = await this.db.changes.query().all().execute();
        // const result: Change[] = [];
        // for (let [id, changes] of allChanges.groupBy(x => x.Entity.id)) {
        //     const remove = changes.find(x => x.Action == "Delete");
        //     if (remove){
        //         result.push(remove);
        //         continue;
        //     }
        //     const create = changes.find(x => x.Action == "Create");
        //     if (create){
        //         result.push(create);
        //     }
        //     const updates = changes.filter(x => x.Action == "Update");
        //     if (updates.length > 0) {
        //         const update = updates.reduce((aggr, current) => ({
        //             ...aggr,
        //             ...current
        //         }));
        //         result.push(update);
        //     }
        // }
        return allChanges;
    }

    public async Remove(ulid: string){
        await this.db.changes.remove(ulid);
    }

}

type TChange<TJson> = {
    Action: "Create" | "Update" | "Delete";
    Entity: TJson | Partial<TJson>;
    Type: "Contexts" | "Messages";
    ulid: string;
}


export type Change = TChange<ContextJSON> | TChange<MessageJSON>;
