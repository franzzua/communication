import {LocalRepository} from "@infr/local/local.repository";
import {ContextJSON, IRepository, MessageJSON, StorageJSON} from "@domain";
import {LocalStorage} from "@infr/local/local.storage";
import {CRD} from "@domain/sync/item-sync";

const asyncTimeout = time => new Promise(resolve => setTimeout(resolve, time));

const crdTimeout = <T>(crd: CRD<T>) => ({
    Create: async item => {
        await asyncTimeout(300);
        await crd.Create(item);
    } ,
    Update: async item => {
        await asyncTimeout(300);
        await crd.Update(item);
    },
    Delete: async item => {
        await asyncTimeout(300);
        await crd.Delete(item);
    }
})

export class SolidMockRepository extends LocalRepository {

    public isOffline = false;

    public Contexts = crdTimeout(this.Contexts);
    public Messages = crdTimeout(this.Messages);

    public async Clear(): Promise<void> {
        await asyncTimeout(300);
        return super.Clear();
    }

    protected async CreateStorage(storageURI: string){
        const localStorage = new LocalStorage(storageURI, storageURI.substr('local://'.length)+'/mock');
        await localStorage.Init();
        this.storages.set(storageURI, localStorage);
        await asyncTimeout(300);
        const json = await localStorage.Load();
        this.stateSubject$.next(json);
        return localStorage;
    }

}
