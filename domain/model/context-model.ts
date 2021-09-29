import {StorageModel} from "./storage-model";
import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {IFactory} from "@domain/model/i-factory";
import {ContextJSON} from "@domain/contracts/json";
import {Permutation} from "@domain/helpers/permutation";
import {Context, Message} from "@model";
import {Model} from "@hypertype/domain";
import { utc } from "@hypertype/core";

export class ContextModel extends Model<Context, IContextActions> implements IContextActions {

    public get State(): Readonly<Omit<Context, keyof {Messages, Parents, Storage}>> {
        return this._state;
    }

    private _messages: Array<MessageModel> = [];
    private _parents: Array<MessageModel> = [];

    public get Messages(): ReadonlyArray<MessageModel> {
        return this._state.Permutation ? this._state.Permutation.Invoke(this._messages.orderBy(x => +x.State.CreatedAt)) : this._messages;
    }

    public get Parents(): ReadonlyArray<MessageModel> {
        return this._parents;
    }

    public get URI(): string {
        return this._state.URI;
    }

    constructor(private readonly factory: IFactory,
                public readonly Storage: StorageModel,
                private _state: Context) {
        super();
    }

    public FromServer(state: ContextJSON) {
        Object.assign(this._state, Context.FromJSON(state));
    }

    public ToJSON(): Context {
        return {
            ...this._state,
            Storage: null,
            equals: Context.equals(this._state)
            // Messages: []
        };
    }

    public FromJSON(state: Context): any {
        Object.assign(this._state, state);
    }

    public ToServer(): ContextJSON {
        return Context.ToJSON(this._state);
    }

    public DetachMessage(message: MessageModel){
        this._messages.remove(message);
    }
    public AttachMessage(message: MessageModel, index: number){
        this._messages.splice(index, 0, message);
        this._state.Permutation  = Permutation.Diff(this._messages.orderBy(x => +x.State.CreatedAt), this._messages);
    }

    public async RemoveMessage(uri: string): Promise<void> {
        const msg = this.Storage.Messages.get(uri);
        await this.Storage.repository.Messages.Delete(msg.ToServer());
        this._messages.remove(msg);
        this.Storage.Messages.delete(uri);
    }

    public SetOrder(): void {

    }

    AddParent(message: MessageModel) {
        this._parents.push(message);
    }
    AddChild(message: MessageModel) {
        this._messages.push(message);
    }

    Save() {
        this._state.UpdatedAt = utc();
        this.Storage.repository.Contexts.Update(this.ToServer());
    }
}
