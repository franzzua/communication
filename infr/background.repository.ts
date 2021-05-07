import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import {tap, utc} from "@hypertype/core";
import { merge } from "@hypertype/core";
import {Change, ChangesStorage} from "@infr/changes/changes-storage";
import {LocalRepository} from "@infr/local/local.repository";
import {ulid} from "ulid";
import {CRD} from "@domain/sync/item-sync";
import {mergeChanges, mergeStorages} from "@infr/changes/merge";
import { concatMap } from "@hypertype/core";


export class BackgroundRepository implements IRepository{
    private changes = new ChangesStorage();
    private local = new LocalRepository()

    constructor(private main: IRepository & {isOffline: boolean}) {
        this.changes.Init().catch(console.error);
    }


    private cacheToLocal<TJson extends MessageJSON | ContextJSON>(local: CRD<TJson>, type: 'Contexts' | 'Messages'): CRD<TJson> {
        return {
            Create: (item: TJson) => Promise.all([
                local.Create(item),
                this.changes.Add({
                    Action: 'Create',
                    Entity: item,
                    Type: type,
                    ulid: ulid()
                })
            ]),
            Update: (changes: Partial<TJson>) => Promise.all([
                local.Update(changes),
                this.changes.Add({
                    Action: 'Update',
                    Type: type,
                    Entity: changes,
                    ulid: ulid()
                })
            ]),
            Delete: (item: TJson)=> Promise.all([
                local.Delete(item),
                this.changes.Add({
                    Action: 'Delete',
                    Type: type,
                    Entity: item,
                    ulid: ulid()
                })
            ])
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


    public async Load(storageURI: string): Promise<StorageJSON> {
        this.main.Load(storageURI).catch(console.error);
        return this.local.Load(storageURI);
    }

    private async Merge(remote: StorageJSON){

        const local = await this.local.Load(remote.URI);

        const localChanges = await this.changes.GetAll();
        for (let change of localChanges) {
            await this.changes.Remove(change.ulid);
        }
        const remoteChanges = mergeStorages(local, remote);

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
        for (let change of localChanges) {
            await this.main[change.Type][change.Action](change.Entity as any);
        }

        for (let change of remoteChanges) {
            await this.local[change.Type][change.Action](change.Entity as any);
        }

        const result = await this.local.Load(remote.URI);
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

