import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {ContextJSON} from "@domain/contracts/json";
import {Permutation} from "@domain/helpers/permutation";
import {Context, Message} from "@model";
import {utc} from "@hypertype/core";
import {cellx} from "cellx";
import {Factory} from "./factory";
import {Model} from "@common/domain";
import {ContextStore} from "@infr/y/contextStore";

export class ContextModel extends Model<Context, IContextActions> implements IContextActions {

    constructor(public URI: string,
                public contextStore: ContextStore,
                private factory: Factory) {
        super();
        // this.$state.subscribe((err, evt) => this.Update());
        cellx(() => this.State.Messages).subscribe((event, data) => {
            this.Messages = new Map(this._messages.map(x => [x.id, x]));
        })
    }

    public get State(): Readonly<Context> {
        const state = this.contextStore.State();
        const context = Context.FromJSON(state.Context);
        context.Messages = Array.from(state.Messages.values()).map(Message.FromJSON);
        return context;
    }

    public set State(value: Readonly<Context>) {
        this.contextStore.State({
            Context: Context.ToJSON(value),
            Messages: new Map(value.Messages.map(x => [x.id, Message.ToJSON(x)])),
        });
    }

    public Messages: ReadonlyMap<string, MessageModel> = new Map();

    private get _messages(): ReadonlyArray<MessageModel> {
        return this.State.Messages.map(x => this.factory.GetOrCreateMessage(x))
    }

    private get DefaultOrderedMessages(): ReadonlyArray<MessageModel> {
        return this._messages.orderBy(x => x.id);
    }

    public get OrderedMessages(): ReadonlyArray<MessageModel> {
        if (!this._messages.length)
            return [];
        if (!this.State.Permutation)
            return this.DefaultOrderedMessages;
        return this.State.Permutation.Invoke(this.DefaultOrderedMessages)
            .filter(x => x != null);
    }

    //
    // private _parents: Array<MessageModel> = [];
    //
    // public get Parents(): ReadonlyArray<MessageModel> {
    //     return this._parents;
    // }


    // public FromServer(state: ContextJSON) {
    //     Object.assign(this.St, Context.FromJSON(state));
    // }

    public ToJSON(): Context {
        const state = this.State;
        return {
            ...state,
            Storage: null,
            equals: Context.equals(state),
            Messages: []
        };
    }

    public FromJSON(state: Context): any {
        throw new Error('not implemented');
        // Object.assign(this.State, state);
    }

    public ToServer(): ContextJSON {
        return Context.ToJSON(this.State);
    }

    DetachMessage(msg: MessageModel) {
        this.UpdateMessagesPermutation(this.OrderedMessages.filter(x => x.id != msg.id));
    };

    AttachMessage(message: MessageModel, index: number) {
        const messages = [...this.OrderedMessages]
        messages.splice(index, 0, message);
        this.UpdateMessagesPermutation(messages);
    };

    async CreateMessage(message: Message): Promise<void> {
        const messageModel = this.factory.GetOrCreateMessage(message);
        // const messages = [...this.OrderedMessages, messageModel];
        // this.UpdateMessagesPermutation(messages);
    };

    ReorderMessage(message: MessageModel, toIndex) {
        const messages = [...this.OrderedMessages.filter(x => x !== message)];
        messages.splice(toIndex, 0, message);
        this.UpdateMessagesPermutation(messages);
    };

    async RemoveMessage(id: string): Promise<void> {
        const messages = this.OrderedMessages.filter(x => x.id !== id);
        this.UpdateMessagesPermutation(messages);
        this.factory.RemoveMessage(id);
    };

    UpdateMessagesPermutation(orderedMessages: Array<MessageModel>) {
        this.State = {
            ...this.State,
            UpdatedAt: utc(),
            Permutation: Permutation.Diff(orderedMessages.orderBy(x => x.id), orderedMessages),
            Messages: orderedMessages.map(x => x.State)
        };
    };

    Actions = this;

}
