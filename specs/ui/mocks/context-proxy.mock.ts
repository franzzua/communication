import {Context} from "@model";
import {MessageProxyMock} from "./message-proxy.mock";
import {cell, ObservableList} from "@cmmn/cell";
import {IContextProxy, IMessageProxy, MessageProxy} from "@proxy";

export class ContextProxyMock implements IContextProxy {
    constructor(private id: string, private content: number[]) {
    }

    @cell
    public readonly messages = new ObservableList(this.content.map(x =>
        new MessageProxyMock(this, x.toString()) as IMessageProxy
    ));


    get Messages(): ReadonlyArray<IMessageProxy> {
        return this.messages.toArray();
    }

    get State() {
        return {
            id: this.id,
            URI: this.id,
            Messages: this.messages.map(x => x.State.id),
        } as Context;
    }


    CreateMessage(message, index = this.Messages.length): IMessageProxy {
        const result = new MessageProxyMock(this, message.id, message.Content);
        this.messages.insert(index, result as any);
        return result;
    }

    MessageMap: Map<string, MessageProxy>;
    ParentsMap: Map<string, MessageProxy>;

    get Parents(): ReadonlyArray<MessageProxy> {
        return undefined;
    }

    RemoveMessage(message: IMessageProxy) {
        this.messages.removeAt(this.Messages.indexOf(message));
    }

    serialize(maxLevel = undefined){
        if (!maxLevel)
            return this.Messages.map(x => x.State.Content);
        return this.Messages.flatMap(x => [x.State.Content, (x.SubContext as ContextProxyMock)?.serialize(maxLevel - 1)].filter(x => x))
    }
}