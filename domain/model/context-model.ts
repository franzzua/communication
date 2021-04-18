import {Injectable} from "@hypertype/core";
import {Model} from "@hypertype/domain";
import {Context, Message} from "@model";
import {StorageModel} from "./storage-model";
import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {IFactory} from "@domain/model/i-factory";
import {ContextJSON, MessageJSON} from "@domain/contracts/json";

@Injectable(true)
export class ContextModel extends Model<ContextJSON, IContextActions> implements IContextActions {

    public readonly Messages: ReadonlyArray<MessageModel> = [];
    public readonly Parents: ReadonlyArray<MessageModel> = [];
    public Storage: StorageModel;
    public readonly State: Context = {};

    public get URI(): string {return  this.State.URI; }

    constructor(private factory: IFactory) {
        super();
    }


    public FromJSON(state: ContextJSON, storage?: StorageModel): any {
        this.Storage ??= storage;
        Object.assign(this.State, {
            URI: state.URI,
            Sorting: state.Sorting,
            Permutation: state.Permutation,
        });
        this.Messages.forEach(m => m.Context = this);
        this.Parents.forEach(m => m.SubContext = this);
    }

    public ToJSON(): ContextJSON {
        return {
            URI: this.State.URI,
            Sorting: this.State.Sorting,
            Permutation: this.State.Permutation,
            StorageURI: this.Storage.URI,
            MessageURIs: this.Messages.map(x => x.URI),
            ParentsURIs: this.Parents.map(x => x.URI),
        };
    }

    public async AddMessage(state: MessageJSON): Promise<MessageModel> {
        state.ContextURI = this.URI;
        const message = await this.Storage.repository.AddMessage(this.ToJSON(), state);
        const model = this.factory.GetOrCreateMessage(message, this.Storage);
        model.Context = this;
        return model;
    }

}
