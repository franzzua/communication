import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import { merge } from "@hypertype/core";
import {Change, ChangesStorage} from "@infr/changes/changes-storage";
import {LocalRepository} from "@infr/local/local.repository";
import {ulid} from "ulid";
import {CRD} from "@domain/sync/item-sync";
import {mergeChanges, mergeStorages} from "@infr/changes/merge";
import { concatMap } from "@hypertype/core";
import {SolidRepository} from "@infr/solid";


export class SolidCachedRepository implements IRepository{
    private changes = new ChangesStorage();
    private local = new LocalRepository(this.storageURI);
    private main = new SolidRepository(this.storageURI);

    constructor(private storageURI: string) {
        this.changes.Init().catch(console.error);
    }

    private cacheToLocal<TJson extends MessageJSON | ContextJSON>(local: CRD<TJson>, type: 'Contexts' | 'Messages'): CRD<TJson> {
        return {
            Create: (item: TJson) => Promise.all([
                local.Create(item),
                this.apply({
                    Action: 'Create',
                    Entity: item,
                    Type: type,
                    ulid: ulid()
                })
            ]),
            Update: (changes: Partial<TJson>) => Promise.all([
                local.Update(changes),
                this.apply({
                    Action: 'Update',
                    Type: type,
                    Entity: changes,
                    ulid: ulid()
                })
            ]),
            Delete: (item: TJson)=> Promise.all([
                local.Delete(item),
                this.apply({
                    Action: 'Delete',
                    Type: type,
                    Entity: item,
                    ulid: ulid()
                })
            ])
        }
    }

    private async apply(change: Change){
        await this.changes.Add(change);
        if (!this.main.isOffline){
            (this.main[change.Type][change.Action](change.Entity as any) as Promise<any>)
                .then(x => {
                    return this.changes.Remove(change.ulid);
                })
                .catch(err => {
                    console.error(err);
                    return this.changes.Add(change)
                });
        }
    }

    public Contexts = this.cacheToLocal(this.local.Contexts, 'Contexts');
    public Messages = this.cacheToLocal(this.local.Messages, 'Messages');

    public async Clear(): Promise<void> {
        await Promise.all([
            this.local.Clear(),
            this.main.Clear()
        ])
    }


    public async Load(): Promise<StorageJSON> {
        this.main.Load().catch(console.error);
        return this.local.Load();
    }

    private async Merge(remote: StorageJSON){

        const local = await this.local.Load();

        const localChanges = (await this.changes.GetAll())
            .orderBy(x => `${x.Type}.${x.Action}`)

        const remoteChanges = mergeStorages(local, remote)
            .orderBy(x => `${x.Type}.${x.Action}`)
        const oldLocalChanges = [...localChanges];
        console.group('merge')
        console.log('local');
        console.table(localChanges);
        console.log('remote')
        console.table(remoteChanges);
        mergeChanges(localChanges, remoteChanges);
        console.log('local');
        console.table(localChanges);
        console.log('remote')
        console.table(remoteChanges);
        console.groupEnd();
        for (let change of oldLocalChanges) {
            await this.changes.Remove(change.ulid);
        }
        for (let change of localChanges) {
            await this.changes.Add(change);
        }
        for (let change of localChanges){
            await this.main[change.Type][change.Action](change.Entity as any);
            await this.changes.Remove(change.ulid);
        }

        for (let change of remoteChanges) {
            await this.local[change.Type][change.Action](change.Entity as any);
        }

        const result = await this.local.Load();
        console.groupCollapsed('merge');
        console.table(result.Messages);
        console.table(result.Contexts);
        console.groupEnd();
        return result;
    }


    private OnMainNewState$ = this.main.State$.pipe(
    );

    public State$ = merge(
        this.main.State$.pipe(
            concatMap(state => this.Merge(state))
        ),
        this.local.State$
    );

}

