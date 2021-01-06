import {DateTime} from "luxon";
import {User} from "./user";
import {Context} from "./context";

export class Message {
    public Content: string;
    public Description?: string;
    public Author?: User;
    public CreatedAt?: DateTime;
    public Context?: Context;
    public SubContext?: Context;
    public Action?: string;
    public URI?: string;
    public id?: string;

    static isLast(message: Message) {
        return message.Context.Messages[message.Context.Messages.length - 1].URI == message.URI;
    }

    static equals(message: Message): (message2: Message) => boolean;
    static equals(message: Message, message2: Message): boolean;
    static equals(...messages: Message[]) {
        if (messages.length == 1) {
            return message2 => {
                if (message2.URI && message2.URI == messages[0].URI)
                    return true;
                if (messages[0].id && messages[0].id == message2.id)
                    return true;
                return false;
            }
        } else {
            return Message.equals(messages[0])(messages[0]);
        }
    }
}