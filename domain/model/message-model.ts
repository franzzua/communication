import {Injectable, utc} from "@hypertype/core";
import {IMessageActions} from "@domain/contracts/actions";
import {Context, Message} from "@model";
import {Factory} from "./factory";
import {Model} from "@common/domain";
import {ContextStore} from "@infr/y/contextStore";

@Injectable(true)
export class MessageModel extends Model<Message, IMessageActions> implements IMessageActions{

    public get Context() {
        return this.factory.GetOrCreateContext(this.$state().Context.URI);
    }

    public get SubContext() {
        return this.$state().SubContext ? this.factory.GetOrCreateContext(this.$state().SubContext.URI) : null;
    }

    constructor(private readonly factory: Factory, private contextStore: ContextStore, public id: string) {
        super();
    }

    public get State() {
        const json = this.contextStore.State().Messages.get(this.id);
        return json && Message.FromJSON(json);
    }

    public set State(value: Readonly<Message>) {
        const cur = this.contextStore.State();
        if (Message.equals(this.State, value))
            return;
        const messages = new Map(cur.Messages);
        messages.set(value.id, Message.ToJSON({
            ...value,
            UpdatedAt: utc()
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
            SubContext: {
                URI: uri
            } as any
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
        const model = this.factory.GetOrCreateMessage(state);
        const newContext = this.factory.GetOrCreateContext(toURI);
        await newContext.Actions.AttachMessage(model, toIndex);
    }

    async Reorder(newOrder: number): Promise<void> {
        if (!this.Context)
            return;
        this.Context.Actions.ReorderMessage(this, newOrder);
    }

}

