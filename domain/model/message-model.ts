import {IMessageActions} from "@domain/contracts/actions";
import {Context, Message} from "@model";
import {ModelLike} from "@cmmn/domain/worker";
import {ContextStore} from "@infr/yjs/contextStore";
import {utc} from "@cmmn/core";
import {ContextModel} from "./context-model";
import {DomainLocator} from "@domain/model/domain-locator.service";

export class MessageModel implements ModelLike<Message, IMessageActions>, IMessageActions {

    Actions = this;
    private $state = this.contextStore.GetMessageCell(this.id)

    public get Context(): ContextModel {
        return this.locator.GetContext(this.$state.get().ContextURI);
    }

    public get SubContext() {
        return this.$state.get()?.SubContextURI && this.locator.GetOrCreateContext(this.$state.get().SubContextURI, this.Context.URI);
    }


    constructor(private readonly locator: DomainLocator,
                private contextStore: ContextStore,
                public id: string) {

    }

    public get State() {
        return this.$state.get();
    }

    public set State(value: Readonly<Message>) {
        this.$state.set(value);
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
        const oldContext = this.locator.GetOrCreateContext(fromURI, null);
        if (oldContext) {
            await oldContext.Actions.RemoveMessage(this.id);
        }
        const newContext = this.locator.GetOrCreateContext(toURI, null);
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

}

