import {IMessageActions} from "@domain/contracts/actions";
import {Context, Message} from "@model";
import {Factory} from "./factory";
import {Model} from "@cmmn/domain/worker";
import {ContextStore} from "@infr/yjs/contextStore";
import {utc} from "@cmmn/core";
import {ContextModel} from "./context-model";

export class MessageModel extends Model<Message, IMessageActions> implements IMessageActions {

    public get Context(): ContextModel {
        return this.factory.GetOrCreateContext(this.$state().ContextURI);
    }

    public get SubContext() {
        return this.$state().SubContextURI && this.factory.GetOrCreateContext(this.$state().SubContextURI);
    }

    constructor(private readonly factory: Factory, private contextStore: ContextStore, public id: string) {
        super();
    }

    public get State() {
        const json = this.contextStore.State().Messages.get(this.id);
        return json && Message.FromJSON(json);
    }

    public set State(value: Readonly<Message>) {
        if (Message.equals(this.State, value))
            return;
        const cur = this.contextStore.State();
        const messages = new Map(cur.Messages);
        messages.set(value.id, Message.ToJSON({
            ...value,
            UpdatedAt: utc(),
        }));
        this.contextStore.State({
            Context: cur.Context,
            Messages: messages
        });
    }


    async UpdateText(text: string): Promise<void> {
        this.State = {
            ...this.State,
            UpdatedAt: utc(),
            Content: text
        };
    }


    async Attach(uri: string): Promise<void> {
        this.State = {
            ...this.State,
            UpdatedAt: utc(),
            SubContextURI: uri
        };
    }

    async Move(fromURI, toURI, toIndex: number) {
        if (fromURI == toURI)
            return await this.Reorder(toIndex);
        const state = {
            ...this.State,
            UpdatedAt: utc(),
            Context: {
                URI: toURI
            } as Context
        };
        const oldContext = this.factory.GetOrCreateContext(fromURI);
        if (oldContext) {
            await oldContext.Actions.RemoveMessage(this.id);
        }
        const newContext = this.factory.GetOrCreateContext(toURI);
        await newContext.Actions.CreateMessage(state, toIndex);
    }

    async Reorder(newOrder: number): Promise<void> {
        if (!this.Context)
            return;
        this.Context.Actions.ReorderMessage(this, newOrder);
    }

    async Remove(): Promise<void> {
        await this.Context.RemoveMessage(this.id);
    }

    public ToServer() {
        return Message.ToJSON(this.State);
    }
}

