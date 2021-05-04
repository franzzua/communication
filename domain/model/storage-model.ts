import {Model} from "@hypertype/domain";
import {Context, Sorting, Storage} from "@model";
import {DomainModel} from "./domain-model";
import {ContextModel} from "./context-model";
import {IFactory} from "./i-factory";
import {IStorageActions} from "../contracts/actions";
import {IRepository} from "../contracts/repository";
import {ContextJSON, StorageJSON} from "@domain/contracts/json";
import {MessageModel} from "@domain/model/message-model";
import {ulid} from "ulid";

export abstract class StorageModel extends Model<StorageJSON, IStorageActions>  implements IStorageActions{
    public domain: DomainModel;
    public Root: ContextModel;
    public Contexts = new Map<string, ContextModel>();
    public Messages = new Map<string, MessageModel>();

    public State: Storage = {URI: undefined, id: undefined, Root: undefined, Type: undefined, Trash: []};

    public get URI(): string {return  this.State.URI; }

    constructor(protected factory: IFactory, public repository: IRepository) {
        super();
    }

    FromJSON(state: StorageJSON, domain?: DomainModel): any {
        this.domain ??= domain;
        Object.assign(this.State, {
            URI: state.URI,
            Type: state.Type
        });
    }

    ToJSON(): StorageJSON {
        return {
            ...this.State,
            Contexts: [...this.Contexts.values()].map(x => x.ToJSON()),
            Messages: [...this.Messages.values()].map(x => x.ToJSON()),
        };
    }

    public async Load(): Promise<void> {
        const json = await this.repository.Init(this.ToJSON());
        await this.Init(json);
    }

    protected async Init(json: StorageJSON){
        for (let message of json.Messages) {
            const model = this.factory.GetOrCreateMessage(message, this);
            this.Messages.set(model.URI, model);
        }
        for (let context of json.Contexts) {
            const model = this.factory.GetOrCreateContext(context, this);
            this.Contexts.set(model.URI, model);
        }
        this.Root = [...this.Contexts.values()].find(x => x.State.IsRoot);
        if (!this.Root){
            const uri  = await this.CreateContext({
                ParentsURIs:[],
                MessageURIs:[],
                URI: undefined,
                IsRoot: true,
                id: ulid(),
                Permutation: null,
                Sorting: Sorting[Sorting.Time] as string,
                StorageURI: this.URI
            });
            this.Root = this.Contexts.get(uri);
        }
    }

    public async CreateContext(context: ContextJSON): Promise<string> {
        const state = await this.repository.CreateContext({
            ...context,
            StorageURI: this.URI
        });
        const result = this.factory.GetOrCreateContext(state, this);
        for (let parentURI of context.ParentsURIs) {
            const message = this.factory.GetMessage(parentURI);
            message.SubContext = result;
            result.Parents.push(message);
        }
        this.Contexts.set(result.URI, result);
        return  result.URI;
    }

    public async Remove(): Promise<void> {
        this.repository.Clear();
    }
    public async Clear(): Promise<void> {
        this.repository.Clear();
    }

}

