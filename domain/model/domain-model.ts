import {Injectable} from "@hypertype/core";
import {Model} from "@hypertype/domain";
import {Storage} from "@model";
import {ContextModel} from "./context-model";
import {StorageModel} from "./storage-model";
import { IFactory } from "./i-factory";
import {IDomainActions} from "../contracts/actions";
import {StorageJSON} from "@domain/contracts/json";

@Injectable()
export class DomainModel extends Model<StorageJSON[], IDomainActions> implements IDomainActions {
    public Storages: StorageModel[] = [];


    constructor(private factory: IFactory) {
        super();
    }


    public FromJSON(state: StorageJSON[]): any {
        this.Storages = state.map(x => this.factory.GetOrCreateStorage(x, this));
    }

    public ToJSON(): StorageJSON[] {
        return this.Storages.map(x => x.ToJSON());
    }

    public async CreateStorage(json: StorageJSON): Promise<StorageModel>{
        const storage = this.factory.GetOrCreateStorage(json, this);
        await storage.Load();
        this.Storages.push(storage);
        return storage;
    }
}
