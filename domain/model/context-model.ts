import {StorageModel} from "./storage-model";
import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {IFactory} from "@domain/model/i-factory";
import {ContextJSON} from "@domain/contracts/json";
import {Permutation} from "@domain/helpers/permutation";
import {Context} from "@model";
import {Model} from "@hypertype/domain";
import {utc} from "@hypertype/core";

export class ContextModel extends Model<Context, IContextActions> implements IContextActions {

    public get State(): Readonly<Omit<Context, keyof { Messages, Parents, Storage }>> {
        return this._state;
    }

    private _messages: Array<MessageModel> = [];

    private get DefaultOrderedMessages(): ReadonlyArray<MessageModel> {
        return this._messages.orderBy(x => x.State.id);
    }

    private get OrderedMessages(): ReadonlyArray<MessageModel> {
        if (!this._messages.length)
            return [];
        if (!this._state.Permutation)
            return this.DefaultOrderedMessages;
        return this._state.Permutation.Invoke(this.DefaultOrderedMessages)
            .filter(x => x != null);
    }

    private _parents: Array<MessageModel> = [];

    public get Messages(): ReadonlyArray<MessageModel> {
        return this.OrderedMessages;
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

    public DetachMessage(msg: MessageModel, force: 'force' | false = false) {
        if (force) {
            this._messages.remove(msg);
            return;
        }
        this.UpdateMessagesPermutation(this.OrderedMessages.filter(x => x.id != msg.id));
    }

    public AttachMessage(message: MessageModel, index: number) {
        const messages = [...this.OrderedMessages]
        messages.splice(index, 0, message);
        this.UpdateMessagesPermutation(messages);
    }

    public async RemoveMessage(uri: string): Promise<void> {
        const msg = this.Storage.Messages.get(uri);
        // if (msg.SubContext)
        //     msg.SubContext.DetachFrom(msg)
        await this.Storage.repository.Messages.Delete(msg.ToServer());
        this.DetachMessage(msg);
        this.Storage.Messages.delete(uri);
        await this.Save();
    }

    private UpdateMessagesPermutation(orderedMessages: Array<MessageModel>) {
        this._messages = orderedMessages;
        this._state.Permutation = Permutation.Diff(this.DefaultOrderedMessages, orderedMessages);
    }

    public SetOrder(): void {

    }

    AddParent(message: MessageModel, force: 'force' | false = false) {
        if (this._parents.includes(message))
            return;
        if (force) {
            this._parents.push(message);
            return;
        }
        this._parents.push(message);
    }

    AddChild(message: MessageModel, force: 'force' | false = false) {
        if (this._messages.includes(message))
            return;
        if (force) {
            this._messages.push(message);
            return;
        }
        this.UpdateMessagesPermutation([...this.OrderedMessages, message]);
    }

    Save() {
        this._state.UpdatedAt = utc();
        this.Storage.repository.Contexts.Update(this.ToServer());
    }

    public DetachFrom(msg: MessageModel, force: 'force' | false = false) {
        this._parents.remove(msg);
    }

    public AttachToParent(msg: MessageModel) {
        this._parents.push(msg);
    }
}
