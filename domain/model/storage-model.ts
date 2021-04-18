import {Model} from "@hypertype/domain";
import {Context, Sorting, Storage} from "@model";
import {DomainModel} from "./domain-model";
import {ContextModel} from "./context-model";
import {IFactory} from "./i-factory";
import {IStorageActions} from "../contracts/actions";
import {IRepository} from "../contracts/repository";
import {ContextJSON, StorageJSON} from "@domain/contracts/json";
import {MessageModel} from "@domain/model/message-model";

export abstract class StorageModel extends Model<StorageJSON, IStorageActions>  implements IStorageActions{
    public domain: DomainModel;
    public Root: ContextModel;
    public Contexts = new Map<string, ContextModel>();
    public Messages = new Map<string, MessageModel>();

    public State: Storage;

    public get URI(): string {return  this.State.URI; }

    constructor(protected factory: IFactory, public repository: IRepository) {
        super();
    }

    FromJSON(state: StorageJSON, domain?: DomainModel): any {
        this.domain ??= domain;
        this.State = {
            ...state,
            Root: null
        };
    }

    ToJSON(): StorageJSON {
        return {
            ...this.State,
            Contexts: [...this.Contexts.values()].map(x => x.ToJSON()),
            Messages: [...this.Messages.values()].map(x => x.ToJSON()),
        };
    }

    public async Load(): Promise<void> {
        const {messages, contexts} = await this.repository.Init(this.ToJSON());
        for (let context of contexts) {
            const model = this.factory.GetOrCreateContext(context, this);
            this.Contexts.set(model.URI, model);
        }
        for (let message of messages) {
            const model = this.factory.GetOrCreateMessage(message, this);
            this.Messages.set(model.URI, model);
        }
        this.Root = [...this.Contexts.values()].find(x => x.Parents.length == 0);
        if (!this.Root){
            this.Root = await this.CreateContext({
                ParentsURIs:[],
                MessageURIs:[],
                URI: undefined,
                Permutation: null,
                Sorting: Sorting.Time,
                StorageURI: this.URI
            });
        }
    }

    public async CreateContext(context: ContextJSON): Promise<ContextModel> {
        const state = await this.repository.CreateContext({
            ...context,
            StorageURI: this.URI
        });
        const result = this.factory.GetOrCreateContext(state, this);
        for (let parentURI of context.ParentsURIs) {
            const message = this.factory.GetMessage(parentURI);
            message.SubContext = result;
            result.Parents.unshift(message);
        }
        this.Contexts.set(result.URI, result);
        return result;

    }

    public async Remove(): Promise<void> {
        this.repository.Clear();
    }
}

