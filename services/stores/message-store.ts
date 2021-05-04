import {ItemStore} from "./item-store";
import {Message, Storage} from "@model";
import {MessageJSON, StorageJSON} from "@domain";
import {ProxyProvider} from "../proxy-provider.service";
import { utc } from "@hypertype/core";

export class MessageStore extends ItemStore<Message, MessageJSON> {

    constructor(private storages: ItemStore<Storage, StorageJSON>,
                private proxyProvider: ProxyProvider) {
        super();
    }

    protected FromJSON(m: MessageJSON): Message {
        return {
            Content: m.Content,
            URI: m.URI,
            Description: m.Description,
            CreatedAt: utc(m.CreatedAt),
            UpdatedAt: utc(m.UpdatedAt),
            id: this.getIdByURI(m.URI)
        };
    }

    protected ToJSON(m: Message): MessageJSON {
        return {
            Content: m.Content,
            URI: m.URI,
            Description: m.Description,
            CreatedAt: m.CreatedAt.toISO(),
            UpdatedAt: m.UpdatedAt?.toISO(),
            StorageURI: m.Context.Storage.URI,
            ContextURI: m.Context.URI,
            SubContextURI: m.SubContext?.URI,
            AuthorURI: m.Author?.URI
        };
    }

    protected async GetURI(item: Message): Promise<string> {
        const json = this.ToJSON(item);
        const proxy = await this.proxyProvider.GetContextProxy(item.Context);
        return await proxy.Actions.AddMessage(json);
    }
}
