import {Injectable} from "@hypertype/core";
import {Model} from "@hypertype/domain";
import {StorageModel} from "./storage-model";
import { IFactory } from "./i-factory";
import {IDomainActions} from "../contracts/actions";
import {DomainJSON, StorageJSON} from "@domain/contracts/json";

@Injectable()
export class DomainModel extends Model<DomainJSON, IDomainActions> implements IDomainActions {
    public Storages: Map<string, StorageModel> = new Map();


    constructor(private factory: IFactory) {
        super();
    }


    public FromJSON(state: DomainJSON): any {
        this.Storages = new Map(state.Storages.map(x => [x.URI, this.factory.GetOrCreateStorage(x, this)]));
    }

    public ToJSON(): DomainJSON {
        return {
            Storages: [...this.Storages.values()].map(x => x.ToJSON())
        };
    }

    public async CreateStorage(json: StorageJSON): Promise<StorageModel>{
        const storage = this.factory.GetOrCreateStorage(json, this);
        await storage.Load();
        this.Storages.set(storage.URI, storage);
        return storage;
    }
}
