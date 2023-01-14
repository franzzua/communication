import {ContextProxyMock} from "./context-proxy.mock";
import {Message} from "@model";
import {Cell, cell} from "@cmmn/cell";
import {utc} from "@cmmn/core";
import { IContextProxy, IMessageProxy} from "@proxy";

export class MessageProxyMock implements IMessageProxy {
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

    set State(value) {
        this.stateCell.set(value);
    }
    @cell
    get SubContext(): IContextProxy {
        return null;
    }
    set SubContext(value: IContextProxy) {
    }

    GetOrCreateSubContext() {
        return this.SubContext = new ContextProxyMock([]);
    }

    public UpdateContent(content: string) {
        this.stateCell.set({
            ...this.State,
            Content: content,
            UpdatedAt: utc()
        });
    }

    // @ts-ignore
    get Context() {
        return this.context;
    }

    AddMessage(message: Message): IMessageProxy {
        return undefined;
    }

    MoveTo(context: IContextProxy, index: number): IMessageProxy {
        if (context == this.Context){
            this.Context.messages.removeAt(this.Context.Messages.indexOf(this));
            this.Context.messages.insert(index, this);
            return this;
        }else{
            this.Context.RemoveMessage(this);
            const result = context.CreateMessage(this.State, index);;
            console.log(this.Context.Messages.map(x => x.State.Content));
            console.log(context.Messages.map(x => x.State.Content));
            return  result;
        }
    }
}