import {Context} from "@model";
import {MessageProxyMock} from "./message-proxy.mock";
import {cell, ObservableList} from "@cmmn/cell";
import {IContextProxy, IMessageProxy, MessageProxy} from "@proxy";

export class ContextProxyMock implements IContextProxy {
    constructor(private content: number[]) {
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
            id: 'test',
            URI: 'test',
            Messages: ['1', '2', '3'],
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
}