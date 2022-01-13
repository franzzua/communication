import {ModelProxy, proxy} from "@common/domain";
import {Context, DomainState, Message} from "@model";
import {IMessageActions} from "@domain";
import {ulid} from "ulid";
import {utc} from "@common/core";
import {ContextProxy} from "./context-proxy";
import {DomainProxy} from "./domain-proxy.service";

@proxy.of(Message, (id, self) => [...self.path, 'Messages', id])
export class MessageProxy extends ModelProxy<Message, IMessageActions> {
    @proxy.link(DomainState)
    Root: DomainProxy;

    @proxy.link<Message>(Context, m => m.ContextURI)
    Context: ContextProxy;

    @proxy.link<Message>(Context, m => m.SubContextURI)
    SubContext?: ContextProxy;

    public AddMessage(message: Message): MessageProxy {
        if (!this.SubContext) {
            const subContext = {
                id: ulid(),
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