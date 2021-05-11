import {DateTime} from "luxon";
import {User} from "./user";
import {Context} from "./context";
import {utc} from "@hypertype/core";
import {MessageJSON} from "@domain";

export class Message {
    public Content: string;
    public Description?: string;
    public Author?: User;
    public CreatedAt: DateTime;
    public UpdatedAt: DateTime;
    public Context?: Context;
    public SubContext?: Context;
    public Action?: string;
    public URI: string;
    public id: string;
    public Order: number;

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

    static FromJSON(m: MessageJSON): Message{
        return  {
            Content: m.Content,
            URI: m.URI,
            Description: m.Description,
            CreatedAt: utc(m.CreatedAt),
            UpdatedAt: utc(m.UpdatedAt),
            Order: m.Order,
            id: m.id,
        };
    }

    static ToJSON(m: Message): MessageJSON {
        return {
            Content: m.Content,
            URI: m.URI,
            id: m.id,
            Description: m.Description,
            CreatedAt: m.CreatedAt.set({millisecond: 0}).toISO(),
            UpdatedAt: m.UpdatedAt.set({millisecond: 0}).toISO(),
            StorageURI: m.Context.Storage.URI,
            ContextURI: m.Context.URI,
            SubContextURI: m.SubContext?.URI,
            AuthorURI: m.Author?.URI,
            Order: m.Order
        };
    }
}
