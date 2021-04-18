import { utc } from "@hypertype/core";
import {AccessRule, Context, Message, Sorting, User} from "@model";
import {open, delete as deleteDB} from "db.js";
import {DateTime} from "luxon";
import {ContextJSON, MessageJSON} from "@domain/contracts/json";

export class LocalStorage{
    constructor(private URI: string) {

    }

    private db: DbJs.Server & {
        contexts: DbJs.TypedObjectStoreServer<ContextEntity>;
        messages: DbJs.TypedObjectStoreServer<MessageEntity>;
    };

    private msgId2URI = id => id && `${this.URI}/msg/${id}`;
    private id2URI = id => id && `${this.URI}/${id}`;
    private uri2id = uri => uri && +(uri.split('/').pop());

    public async Init(){
        this.db = await open({
            server: this.URI.substr('local://'.length),
            version: 3,
            schema: {
                contexts: {
                    key: {keyPath: 'id', autoIncrement: true},
                },
                messages: {
                    key: {keyPath: 'id', autoIncrement: true},
                },
            }
        }) as any;
    }

    public async Load(){
        const contextEntities = await this.db.contexts.query().all().execute();
        const messageEntities = await this.db.messages.query().all().execute();
        const contextMap = new Map<number, ContextJSON>(contextEntities.map(x => [x.id, ({
            Permutation: x.Permutation,
            Sorting: x.Sorting,
            // Access: x.Access,
            MessageURIs: [],
            ParentsURIs: [],
            URI: this.id2URI(x.id),
        } as ContextJSON)]));
        const messages = messageEntities.map(x => {
            const uri = this.msgId2URI(x.id);
            const context = contextMap.get(x.ContextId);
            if (context) context.MessageURIs.push(uri);
            const subContext = contextMap.get(x.SubContextId);
            if (subContext) subContext.ParentsURIs.push(uri);
            return ({
                Content: x.Content,
                Description: x.Description,
                AuthorURI: x.AuthorURI,
                CreatedAt: x.CreatedAt ? utc(x.CreatedAt) : undefined,
                Action: x.Action,
                ContextURI: context?.URI,
                SubContextURI: subContext?.URI,
                URI: uri,
            } as MessageJSON);
        })
        const contexts = [...contextMap.values()];
        return {messages, contexts};
    }

    public async AddContext(context: ContextJSON): Promise<string> {
        const entity = this.contextToEntity(context);
        delete entity.id;
        await this.db.contexts.add(entity);
        for (let parentURI of context.ParentsURIs) {
            const id = this.uri2id(parentURI);
            const parent = await this.db.messages.get(id);
            parent.SubContextId = entity.id;
            await this.db.messages.update(parent);
        }
        return this.id2URI(entity.id);
    }

    public async AddMessage(message: MessageJSON): Promise<string>{
        const entity = this.messageToEntity(message);
        delete entity.id;
        await this.db.messages.add(entity);
        return this.msgId2URI(entity.id);
    }

    public async Clear(){
        await deleteDB(this.URI);
    }

    public async UpdateMessage(message: MessageJSON): Promise<void> {
        const entity = this.messageToEntity(message);
        await this.db.messages.update(entity);
    }

    private messageToEntity(message: MessageJSON): MessageEntity{
        return  {
            Content: message.Content,
            Description: message.Description,
            AuthorURI: message.AuthorURI,
            CreatedAt: message.CreatedAt?.toISO(),
            Action: message.Action,
            ContextId: this.uri2id(message.ContextURI),
            SubContextId: this.uri2id(message.SubContextURI),
            id: this.uri2id(message.URI),
        }
    }
    private contextToEntity(context: ContextJSON): ContextEntity{
        return  {
            // Access: context.Access,
            id: this.uri2id(context.URI),
            Sorting: context.Sorting,
            Permutation: context.Permutation
        }
    }
}

type ContextEntity = {
    id: number,
    // Access: Array<AccessRule>,
    Sorting: Sorting,
    Permutation?: any,
};
type MessageEntity ={
    Content: string;
    Description?: string;
    AuthorURI?: string;
    CreatedAt?: string;
    Action?: string;
    ContextId: number;
    SubContextId: number;
    id: number;
}
