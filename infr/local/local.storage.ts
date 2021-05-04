import {delete as deleteDB, open} from "db.js";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

export class LocalStorage {
    constructor(public URI: string, private version: number = 1) {

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
            version: this.version,
            schema: {
                contexts: {
                    key: {keyPath: 'id', autoIncrement: true},
                },
                messages: {
                    key: {keyPath: 'id', autoIncrement: true},
                }
            }
        }) as any;
    }

    public async Load(): Promise<StorageJSON>{
        const contextEntities = await this.db.contexts.query().all().execute();
        const messageEntities = await this.db.messages.query().all().execute();
        const contextMap = new Map<number, ContextJSON>(contextEntities.map(x => [x.id, ({
            Permutation: x.Permutation,
            Sorting: x.Sorting,
            // Access: x.Access,
            UpdatedAt: x.UpdatedAt,
            MessageURIs: [],
            IsRoot: x.IsRoot,
            StorageURI: this.URI,
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
                CreatedAt: x.CreatedAt,
                UpdatedAt: x.UpdatedAt,
                Action: x.Action,
                ContextURI: context?.URI,
                SubContextURI: subContext?.URI,
                StorageURI: this.URI,
                URI: uri,
            } as MessageJSON);
        })
        const contexts = [...contextMap.values()];
        return {
            Type: 'local',
            URI: this.URI,
            Contexts: contexts,
            Messages: messages
        };
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


    public async UpdateContext(ctx: ContextJSON): Promise<void> {
        const entity = this.contextToEntity(ctx);
        await this.db.contexts.update(entity);
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
            CreatedAt: message.CreatedAt,
            UpdatedAt: message.UpdatedAt,
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
            Permutation: context.Permutation,
            UpdatedAt: context.UpdatedAt,
            IsRoot: context.IsRoot,
        }
    }

    public async RemoveMessage(msg: MessageJSON): Promise<void> {
        await this.db.messages.remove(this.uri2id(msg.URI));
    }

    public static async getAllDatabases(): Promise<LocalStorage[]> {
        // @ts-ignore
        const databases = await indexedDB.databases();
        const storages = databases.map(d => new LocalStorage(`local://${d.name}`, d.version));
        for (let storage of storages) {
            await storage.Init();
        }
        return  storages;
    }
}

type ContextEntity = {
    id: number,
    // Access: Array<AccessRule>,
    Sorting: string,
    UpdatedAt?: string;
    Permutation?: any,
    IsRoot: boolean,
};
type MessageEntity ={
    Content: string;
    Description?: string;
    AuthorURI?: string;
    CreatedAt?: string;
    Action?: string;
    UpdatedAt?: string;
    ContextId: number;
    SubContextId: number;
    id: number;
}
