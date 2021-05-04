import {Injectable} from "@hypertype/core";
import {Model} from "@hypertype/domain";
import {StorageModel} from "./storage-model";
import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {IFactory} from "@domain/model/i-factory";
import {ContextJSON, MessageJSON} from "@domain/contracts/json";
import {Permutation} from "@domain/helpers/permutation";

@Injectable(true)
export class ContextModel extends Model<ContextJSON, IContextActions> implements IContextActions {

    public Messages: MessageModel[] = [];
    public Parents: MessageModel[] = [];
    public Storage: StorageModel;
    public State: Omit<ContextJSON, keyof {StorageURI, MessageURIs, ParentsURIs, Permutation}>;

    public get URI(): string {return  this.State.URI; }

    constructor(private factory: IFactory) {
        super();
    }

    public FromJSON(state: ContextJSON, storage?: StorageModel): any {
        this.Storage ??= storage;
        this.State = state;

        const permutation =  state.Permutation ? Permutation.Parse(state.Permutation) : null;
        const messages = state.MessageURIs
            .map(x => this.factory.GetMessage(x))
            .orderBy(x => +x.State.CreatedAt);
        this.Messages = permutation ? permutation.Invoke(messages): messages;
        this.Parents = state.ParentsURIs
            .map(x => this.factory.GetMessage(x));

        this.Messages.forEach(m => m.Context = this);
        this.Parents.forEach(m => m.SubContext = this);
    }

    public ToJSON(): ContextJSON {
        const permutation = Permutation.Diff(this.Messages.orderBy(x => +x.State.CreatedAt), this.Messages);
        return {
            ...this.State,
            Permutation: permutation.toString(),
            StorageURI: this.Storage.URI,
            MessageURIs: this.Messages.map(x => x.URI),
            ParentsURIs: this.Parents.map(x => x.URI)
        };
    }

    public async AddMessage(state: MessageJSON): Promise<string> {
        console.log('domain.add-message', state);
        state.ContextURI = this.URI;
        const message = await this.Storage.repository.AddMessage(state);
        const model = this.factory.GetOrCreateMessage(message, this.Storage);
        model.Context = this;
        this.Messages.push(model);
        this.Storage.Messages.set(model.URI, model);
        return model.URI;
    }

    public async RemoveMessage(uri: string): Promise<void> {
        const msg = this.Storage.Messages.get(uri);
        await this.Storage.repository.RemoveMessage(msg.ToJSON());
        msg.Context = null;
        this.Messages.remove(msg);
        this.Storage.Messages.delete(uri);
    }

}
