import {IMessageActions} from "@domain";
import {ContextProxyMock} from "./context-proxy.mock";
import {Message} from "@model";
import { Cell } from "@cmmn/cell";
import { utc } from "@cmmn/core";

export class MessageProxyMock implements IMessageActions {
    constructor(private context: ContextProxyMock,
                private id: string,
                private content = id) {
    }

    private stateCell: Cell<Message> = new Cell({
        id: this.id,
        Content: this.content,
        UpdatedAt: utc()
    } as Message);

    get State() {
        return this.stateCell.get();
    }

    Actions: IMessageActions = this;

    async Attach(uri: string): Promise<void> {
    }

    async CreateSubContext(uri: string, parentURI: string): Promise<void> {
    }

    async Move(fromURI: string, toURI: string, toIndex: number): Promise<void> {
    }

    async Remove(): Promise<void> {
        this.Context.messages.removeAt(this.Context.Messages.indexOf(this));
    }

    async Reorder(newOrder: number): Promise<void> {
        this.Context.messages.removeAt(this.Context.Messages.indexOf(this));
        this.Context.messages.insert(newOrder, this);
    }

    async UpdateText(text: string): Promise<void> {
        this.stateCell.set({
            ...this.State,
            Content: text,
            UpdatedAt: utc()
        });
    }

    // @ts-ignore
    get Context() {
        return this.context;
    }
}