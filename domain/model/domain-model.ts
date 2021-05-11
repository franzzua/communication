import {Injectable} from "@hypertype/core";
import {Model} from "@hypertype/domain";
import {StorageModel} from "./storage-model";
import { IFactory } from "./i-factory";
import {IDomainActions} from "../contracts/actions";
import { StorageJSON} from "@domain/contracts/json";
import {DomainState, Storage} from "@model";

@Injectable()
export class DomainModel extends Model<DomainState, IDomainActions> implements IDomainActions {
    public Storages: Map<string, StorageModel> = new Map();


    constructor(private factory: IFactory) {
        super();
    }


    public FromJSON(state: DomainState): any {
        this.Storages = new Map(state.Storages.map(x => [x.URI, this.factory.GetOrCreateStorage(x, this)]));
    }

    public ToJSON(): DomainState{
        return {
            Storages: [...this.Storages.values()].map(x => x.State)
        };
    }

    public async CreateStorage(json: Storage): Promise<StorageModel>{
        const storage = this.factory.GetOrCreateStorage(json, this);
        await storage.Load();
        this.Storages.set(storage.URI, storage);
        return storage;
    }
}
