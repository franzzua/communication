import {IRepository} from "@domain";
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
                    key: {keyPath: 'id', autoIncrement: true},
                },
            }
        }) as any;
    }

    public async Add(change: Change): Promise<number>{
        await this.db.changes.add(change);
        return change.id;
    }

    public async GetAll(): Promise<Change[]> {
        return await this.db.changes.query().all().execute();
    }

    public async Remove(id: number){
        await this.db.changes.remove(id);
    }

}

export type Change = {
    Action: keyof IRepository;
    Args: any;
    id?: number;
}
