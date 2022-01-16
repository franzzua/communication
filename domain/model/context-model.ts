import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {ContextJSON} from "@domain/contracts/json";
import {Permutation} from "@domain/helpers/permutation";
import {Context, Message} from "@model";
import {Factory} from "./factory";
import {Model} from "@common/domain/worker";
import {ContextStore} from "@infr/yjs/contextStore";
import {DateTime} from "luxon";
import {Fn} from "@common/core";

export class ContextModel extends Model<Context, IContextActions> implements IContextActions {

    constructor(public URI: string,
                public contextStore: ContextStore,
                private factory: Factory) {
        super();
    }

    private _cache = new Map<string, MessageModel>();
    private GetOrCreateMessage(id: string){
        return this._cache.getOrAdd(id,id => new MessageModel(this.factory, this.contextStore, id));
    }

    public get State(): Readonly<Context> {
        const state = this.contextStore.State();
        const context = Context.FromJSON(state.Context);

        if (context.Permutation?.isInvalid()) {
            console.error("invalid permutation");
            context.Permutation = null;
        }
        context.Messages = Array.from(state.Messages.keys());
        return context;
    }

    public set State(value: Readonly<Context>) {
        if (value.Permutation && (value.Permutation.isInvalid() || value.Permutation.values.length > value.Messages.length))
            throw new Error("invalid permutation")
        this.contextStore.State({
            Context: Context.ToJSON(value),
            Messages: new Map(value.Messages.map(x => [x, this.GetOrCreateMessage(x).ToServer()]))
        });
    }

    public *getParents(): IterableIterator<MessageModel> {
        for (let context of this.factory.Root.Contexts.values()) {
            for (let message of context.Messages.values()) {
                if (message.SubContext === this)
                    yield message;
            }
        }
    }

    public get Messages(): ReadonlyMap<string, MessageModel> {
        const state = this.contextStore.State();
        return state.Messages.map(x => this.GetOrCreateMessage(x.id));
    }

    private get DefaultOrderedMessages(): ReadonlyArray<MessageModel> {
        return [...this.Messages.values()].orderBy(x => x.id);
    }

    public get OrderedMessages(): ReadonlyArray<MessageModel> {
        if (!this.Messages.size)
            return [];
        if (!this.State.Permutation)
            return this.DefaultOrderedMessages;
        return this.State.Permutation.Invoke(this.DefaultOrderedMessages)
            .filter(x => x != null);
    }

    public ToJSON(): Context {
        const state = this.State;
        return {
            ...state,
            Storage: null,
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

    async CreateMessage(message: Message, index: number = this.Messages.size): Promise<void> {
        if (!message.id)
            message.id = Fn.ulid();
        if (message.ContextURI && message.ContextURI !== this.URI){
            this.factory.GetContext(message.ContextURI).RemoveMessage(message.id);
        }
        message.ContextURI = this.URI;
        const messageModel = this.GetOrCreateMessage(message.id);
        messageModel.State = message;
        const messages = [...this.OrderedMessages, messageModel];
        this.UpdateMessagesPermutation(messages.distinct());
    };

    ReorderMessage(message: MessageModel, toIndex) {
        const messages = [...this.OrderedMessages.filter(x => x !== message)];
        messages.splice(toIndex, 0, message);
        this.UpdateMessagesPermutation(messages);
    };

    async RemoveMessage(id: string): Promise<void> {
        const messages = this.OrderedMessages.filter(x => x.id !== id);
        this.UpdateMessagesPermutation(messages);
    };

    UpdateMessagesPermutation(orderedMessages: ReadonlyArray<MessageModel>) {
        const permutation = Permutation.Diff(orderedMessages.orderBy(x => x.id), orderedMessages);
        if (permutation.isInvalid())
            throw new Error("invalid permutation")
        this.State = {
            ...this.State,
            UpdatedAt: DateTime.utc(),
            Permutation: permutation,
            Messages: orderedMessages.map(x => x.id)
        };
    };

    Actions = this;

}
