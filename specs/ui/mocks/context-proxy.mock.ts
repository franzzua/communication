import {Context} from "@model";
import {MessageProxyMock} from "./message-proxy.mock";
import {cell, ObservableList} from "@cmmn/cell";

export class ContextProxyMock {
    constructor(test: string) {
    }

    @cell
    public readonly messages = new ObservableList([
        new MessageProxyMock(this, '1'),
        new MessageProxyMock(this, '2'),
        new MessageProxyMock(this, '3'),
    ]);


    get Messages(): ReadonlyArray<MessageProxyMock> {
        return this.messages.toArray();
    }

    get State() {
        return {
            id: 'test',
            URI: 'test',
            Messages: ['1', '2', '3'],
        } as Context;
    }


    CreateMessage(message, index = this.Messages.length) {
        const result = new MessageProxyMock(this, message.id, message.Content);
        this.messages.insert(index, result);
        return result;
    }
}