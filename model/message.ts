import {DateTime} from "luxon";
import {User} from "./user";
import {Context} from "./context";
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
    public id: string;
    public equals?(m: Message): boolean;
    static isLast(message: Message) {
        return message.Context.Messages[message.Context.Messages.length - 1].id == message.id;
    }

    static equals(message1: Message, message2: Message): boolean{
        if (!message2 && message1 || !message1 && message2)
            return false;
        if (message2.id !== message1.id)
            return false;
        return message2.UpdatedAt.equals(message1.UpdatedAt);
    }

    static FromJSON(m: MessageJSON): Message{
        return Object.assign(new Message(), {
            Content: m.Content,
            Description: m.Description,
            CreatedAt: DateTime.fromISO(m.CreatedAt, {zone: 'utc'}),
            UpdatedAt: DateTime.fromISO(m.UpdatedAt, {zone: 'utc'}),
            id: m.id,
            Context: m.ContextURI && {
                URI: m.ContextURI
            } as Context,
            SubContext: m.SubContextURI && {
                URI: m.SubContextURI
            } as Context,
        });
    }


    static ToJSON(m: Message): MessageJSON {
        return {
            Content: m.Content,
            id: m.id,
            Description: m.Description,
            CreatedAt: m.CreatedAt.toISO(),
            UpdatedAt: m.UpdatedAt.toISO(),
            StorageURI: m.Context?.Storage?.URI,
            ContextURI: m.Context?.URI,
            SubContextURI: m.SubContext?.URI,
            AuthorURI: m.Author?.URI,
        };
    }
}
