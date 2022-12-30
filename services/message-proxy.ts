import {ModelProxy, proxy} from "@cmmn/domain/proxy";
import {Context, DomainState, Message} from "@model";
import {IMessageActions} from "@domain";
import {utc, Fn} from "@cmmn/core";
import {ContextProxy} from "./context-proxy";
import {DomainProxy} from "./domain-proxy";

export class MessageProxy extends ModelProxy<Message, IMessageActions> {
    Root: DomainProxy;

    Context: ContextProxy;

    SubContext?: ContextProxy;

    public AddMessage(message: Message): MessageProxy {
        if (!this.SubContext) {
            const subContext = {
                id: Fn.ulid(),
                Messages: [],
                Parents: [this.State.id],
                Storage: null,
                UpdatedAt: utc(),
                CreatedAt: utc(),
                IsRoot: false,
                URI: undefined,
            } as Context;
            subContext.URI = `${this.Context.State.URI.split('/').slice(0, -1).join('/')}/${subContext.id}`;
            this.State = {
                ...this.State,
                SubContextURI: subContext.URI,
                UpdatedAt: utc()
            };
            this.SubContext.State = subContext;
        }
        this.SubContext.Actions.CreateMessage(message);
        return this.SubContext.MessageMap.get(message.id);
    }
}
