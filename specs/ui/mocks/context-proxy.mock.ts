import {Context} from "@model";
import {MessageProxyMock} from "./message-proxy.mock";

export class ContextProxyMock {
    constructor(test: string) {
    }

    private messages: Array<MessageProxyMock> = [
        new MessageProxyMock(this, '1'),
        new MessageProxyMock(this, '2'),
        new MessageProxyMock(this, '3'),
    ];

    get Messages(): ReadonlyArray<MessageProxyMock> {
        return this.messages;
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
        this.messages.push(result);
        return result;
    }
}