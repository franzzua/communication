import {ModelProxy, proxy} from "@cmmn/domain/proxy";
import {Context, DomainState, Message} from "@model";
import {IMessageActions} from "@domain";
import {Fn, utc} from "@cmmn/core";
import {ContextProxy} from "./context-proxy";
import {DomainProxy} from "./domain-proxy";

@proxy.of(Message, (id, self) => ['Messages', id])
export class MessageProxy extends ModelProxy<Message, IMessageActions> {

    constructor(stream, locator) {
        super(stream, locator);
    }

    @proxy.link(DomainState)
    Root: DomainProxy;

    @proxy.link<Message>(Context, m => m.ContextURI)
    Context: ContextProxy;

    @proxy.link<Message>(Context, m => m.SubContextURI)
    SubContext?: ContextProxy;

    public GetOrCreateSubContext(): ContextProxy {
        if (this.SubContext)
            return this.SubContext;
        const id = Fn.ulid();
        const uri = this.Context.State.URI.replace(this.Context.State.id, id);
        const subContext = {
            id,
            Messages: [],
            Parents: [this.State.id],
            Storage: null,
            UpdatedAt: utc(),
            CreatedAt: utc(),
            IsRoot: false,
            URI: uri,
        } as Context;
        this.State = {
            ...this.State,
            SubContextURI: subContext.URI,
            UpdatedAt: utc()
        };
        this.SubContext.State = subContext;
        return this.SubContext;
    }

    public AddMessage(message: Message): MessageProxy {
        this.GetOrCreateSubContext();
        this.SubContext.Actions.CreateMessage(message);
        this.SubContext.Diff(state => ({
           ...state,
           Messages: [...state.Messages, message.id]
        }));
        message.ContextURI = this.SubContext.State.URI;
        const result = this.SubContext.MessageMap.get(message.id);
        result.State = message;
        return result;
    }

    public MoveTo(context: ContextProxy, index: number = context.State.Messages.length): MessageProxy {
        this.Context.State.Messages.remove(this.State.id);
        this.Context.Actions.RemoveMessage(this.State.id);
        const newState = {
            ...this.State,
            id: Fn.ulid(),
            ContextURI: context.State.URI
        };
        context.Actions.CreateMessage(newState, index);

        context.State = {
            ...context.State,
            Messages: [
                ...context.State.Messages.slice(0, index),
                newState.id,
                ...context.State.Messages.slice(index)
            ]
        };
        const result = context.MessageMap.get(newState.id);
        result.State = newState;
        return result;
    }
}
