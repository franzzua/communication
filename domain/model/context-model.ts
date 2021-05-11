import {StorageModel} from "./storage-model";
import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {IFactory} from "@domain/model/i-factory";
import {ContextJSON} from "@domain/contracts/json";
import {Permutation} from "@domain/helpers/permutation";
import {Context, Message} from "@model";

export class ContextModel implements IContextActions {

    public get Messages(): ReadonlyArray<MessageModel>{
        return this.State.Messages
            .map(x => this.factory.GetMessage(x.URI));
    }

    public get Parents(): ReadonlyArray<MessageModel>{
        return this.State.Parents
            .map(x => this.factory.GetMessage(x.URI));
    }

    public get URI(): string {return  this.State.URI; }

    constructor(private readonly factory: IFactory,
                public readonly Storage: StorageModel,
                public readonly State: Context) {

    }

    public Link(messages: Message[], parents: Message[]){
        this.State.Messages = messages;
        this.State.Parents = parents;
        for (let message of messages) {
            message.Context = this.State;
        }
        for (let message of parents) {
            message.SubContext = this.State;
        }
    }

    public Update(state: ContextJSON){
        Object.assign(this.State, Context.FromJSON(state));
    }

    public ToJSON(): ContextJSON {
        const permutation = Permutation.Diff(this.State.Messages.orderBy(x => +x.CreatedAt), this.State.Messages);
        return {
            ...Context.ToJSON(this.State),
            Permutation: permutation.toString(),
            // MessageURIs: this.Messages.map(x => x.URI),
            // ParentsURIs: this.Parents.map(x => x.URI)
        };
    }


    public async RemoveMessage(uri: string): Promise<void> {
        const msg = this.Storage.Messages.get(uri);
        await this.Storage.repository.Messages.Delete(msg.ToJSON());
        msg.State.Context = null;
        this.State.Messages.remove(msg.State);
        this.Storage.Messages.delete(uri);
    }

    public SetOrder(): void {

    }
}
