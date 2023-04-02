import {ModelProxy, proxy} from "@cmmn/domain/proxy";
import {Context, DomainState, Message} from "@model";
import {IMessageActions} from "@domain";
import {Fn, utc} from "@cmmn/core";
import type {IContextProxy} from "./context-proxy";
import {DomainProxy} from "./domain-proxy";

@proxy.of(Message, (id, self) => ['Messages', id])
export class MessageProxy extends ModelProxy<Message, IMessageActions>
    implements IMessageProxy{

    constructor(stream, locator) {
        super(stream, locator);
    }

    @proxy.link(DomainState)
    Root: DomainProxy;

    @proxy.link<Message>(Context, m => m.ContextURI)
    Context: IContextProxy;

    @proxy.link<Message>(Context, m => m.SubContextURI)
    SubContext?: IContextProxy;

    public get Messages(){
        return this.SubContext?.Messages ?? [];
    }

    public GetOrCreateSubContext(): IContextProxy {
        if (this.SubContext)
            return this.SubContext;
        const id = Fn.ulid();
        const uri = this.Context.State.URI.replace(this.Context.State.id, id);
        this.Actions.CreateSubContext(uri, this.Context.State.URI);
        this.State = {
            ...this.State,
            SubContextURI: uri,
            UpdatedAt: utc()
        };
        this.SubContext.State = {
            id,
            Messages: [],
            Parents: [this.State.id],
            Storage: null,
            UpdatedAt: utc(),
            CreatedAt: utc(),
            IsRoot: false,
            URI: uri,
        } as Context;
        return this.SubContext;
    }

    public AddMessage(message: Message): IMessageProxy {
        console.log(message.id, message.Content);
        this.GetOrCreateSubContext();
        this.SubContext.CreateMessage(message, 0);
        this.SubContext.State = {
           ...this.SubContext.State,
           Messages: [...this.SubContext.State.Messages, message.id]
        };
        message.ContextURI = this.SubContext.State.URI;
        const result = this.SubContext.MessageMap.get(message.id);
        result.State = message;
        return result;
    }


    public MoveTo(context: IContextProxy, index: number): IMessageProxy {
        if (context !== this.Context) {
            this.Context.State = {
                ...this.Context.State,
                Messages: this.Context.State.Messages.filter(x => x != this.State.id)
            };
            this.Context.RemoveMessage(this);
            const newState = {
                ...this.State,
                id: Fn.ulid(),
                ContextURI: context.State.URI
            };
            context.CreateMessage(newState, index);

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
        }else {
            this.Actions.Reorder(index);
            return  this;
        }
    }

    public UpdateContent(content: string){
        this.Actions.UpdateText(content);
        this.State = {
            ...this.State,
            Content: content
        }
    }
}

export interface IMessageProxy {
    State: Message;
    Context: IContextProxy;
    SubContext?: IContextProxy;

    GetOrCreateSubContext(): IContextProxy;

    AddMessage(message: Message): IMessageProxy;

    MoveTo(context: IContextProxy, index: number): IMessageProxy;

    UpdateContent(content: string): void;
}
