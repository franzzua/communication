import {MessageModel} from "./message-model";
import {IContextActions} from "../contracts/actions";
import {Permutation} from "@domain/helpers/permutation";
import {Context, Message} from "@model";
import {ModelLike} from "@cmmn/domain/worker";
import {MessageStore} from "@infr/yjs/messageStore";
import {Fn, utc} from "@cmmn/core";
import {DomainLocator} from "@domain/model/domain-locator.service";

export class ContextModel implements ModelLike<Context, IContextActions>, IContextActions {

    Actions = this;

    constructor(public URI: string,
                public contextStore: MessageStore,
                private locator: DomainLocator) {
    }

    private _cache = new Map<string, MessageModel>();

    private GetOrCreateMessage(id: string): MessageModel {
        return this._cache.getOrAdd(id, id => new MessageModel(this.locator, this.contextStore, id));
    }

    public get Messages(): Map<string, MessageModel> {
        return new Map(this.State.Messages.map(x => [x, this.GetOrCreateMessage(x)]));
    }

    public get State(): Readonly<Context> {
        return this.contextStore.$state.get();
    }

    public set State(value: Readonly<Context>) {
        this.contextStore.$state.set(value);
    }

    public* getParents(): IterableIterator<MessageModel> {
        // @ts-ignore
        for (let context of this.locator.root.Contexts.values()) {
            for (let message of context.Messages.values()) {
                if (message.SubContext === this)
                    yield message;
            }
        }
    }


    async CreateMessage(message: Message, index: number = this.State.Messages.length): Promise<void> {
        await this.contextStore.Sync;
        if (!message.id)
            message.id = Fn.ulid();
        if (message.ContextURI && message.ContextURI !== this.URI) {
            this.locator.Root.Contexts.get(message.ContextURI).RemoveMessage(message.id);
        }
        message.ContextURI = this.URI;
        const messages = this.State.Messages;
        messages.remove(message.id);
        messages.splice(index, 0, message.id);
        this.State = {
            ...this.State,
            Messages: messages
        }

        const messageModel = this.GetOrCreateMessage(message.id);
        messageModel.State = message;
    };

    ReorderMessage(message: MessageModel, toIndex) {
        const messages = this.State.Messages.filter(x => x !== message.id);
        messages.splice(toIndex, 0, message.id);
        this.State = {
            ...this.State,
            Messages: messages
        }
    };

    async RemoveMessage(id: string): Promise<void> {
        this.State = {
            ...this.State,
            Messages: this.State.Messages.filter(x => x !== id)
        }
    };

}
