import {delete as deleteDB, open} from "db.js";
import {ContextJSON, MessageJSON, StorageJSON} from "@domain/contracts/json";

export class LocalStorage {
    constructor(public URI: string,
                private server = URI.substr('local://'.length),
                private version: number = 1) {

    }

    private db: DbJs.Server & {
        contexts: DbJs.TypedObjectStoreServer<ContextEntity>;
        messages: DbJs.TypedObjectStoreServer<MessageEntity>;
    };
    //
    // private msgId2URI = id => id && `${this.URI}/msg/${id}`;
    // private id2URI = id => id && `${this.URI}/${id}`;
    // private uri2id = uri => uri && +(uri.split('/').pop());

    public async Init(){
        this.db = await open({
            server: this.server,
            version: this.version,
            schema: {
                contexts: {
                    key: {keyPath: 'URI'},
                },
                messages: {
                    key: {keyPath: 'URI'},
                }
            }
        }) as any;
    }



    public async Load(): Promise<StorageJSON>{
        const contextEntities = await this.db.contexts.query().all().execute();
        const messageEntities = await this.db.messages.query().all().execute();
        console.groupCollapsed('local storage: load');
        console.table(contextEntities);
        console.table(messageEntities);
        console.groupEnd();
        return {
            Type: 'local',
            URI: this.URI,
            Contexts: contextEntities,
            Messages: messageEntities
        };
    }

    public async AddContext(context: ContextJSON): Promise<string> {
        const entity = {...context};
        // delete entity.ParentsURIs;
        // delete entity.MessageURIs;
        // for (let parentURI of context.ParentsURIs) {
        //     const parent = await this.db.messages.get(parentURI);
        //     parent.SubContextURI = context.URI;
        //     await this.db.messages.update(parent);
        // }
        await this.db.contexts.add(entity);
        console.groupCollapsed('local storage: add context', entity.id);
        console.table(await this.db.contexts.query().all().execute());
        console.groupEnd();
        return context.URI;
    }

    public async AddMessage(message: MessageJSON): Promise<string>{
        console.log(this.server, 'add.message', message.Content);
        await this.db.messages.add(message);
        console.groupCollapsed('local storage: add message', message.id);
        console.table(await this.db.messages.query().all().execute());
        console.groupEnd();
        return message.URI;
    }


    public async UpdateContext(id, change: Partial<ContextJSON>): Promise<void> {
        const existed =await this.db.contexts.get(id);
        // delete change.ParentsURIs;
        // delete change.MessageURIs;
        await this.db.contexts.update({
            ...existed,
            ...change
        });
        console.groupCollapsed('local storage: update context', id);
        console.table(await this.db.contexts.query().all().execute());
        console.groupEnd();
    }

    public async Clear(){
        await deleteDB(this.server);
    }

    public async UpdateMessage(id, message: Partial<MessageJSON>): Promise<void> {
        const existed = await this.db.messages.get(id);
        await this.db.messages.update({
            ...existed,
            ...message
        });
        console.groupCollapsed('local storage: update message', message.id);
        console.table(await this.db.messages.query().all().execute());
        console.groupEnd();
    }

    public async RemoveMessage(message: MessageJSON): Promise<void> {
        await this.db.messages.remove(message.URI);
        console.groupCollapsed('local storage: remove message', message.id);
        console.table(await this.db.messages.query().all().execute());
        console.groupEnd();
    }

    public static async getAllDatabases(): Promise<LocalStorage[]> {
        // @ts-ignore
        const databases = await indexedDB.databases();
        const storages = databases.map(d => new LocalStorage(`local://${d.name}`, d.name, d.version));
        for (let storage of storages) {
            await storage.Init();
        }
        return  storages;
    }

    public async RemoveContext(context: ContextJSON): Promise<void> {
        await this.db.contexts.remove(context.URI);
        console.groupCollapsed('local storage: remove context', context.id);
        console.table(await this.db.contexts.query().all().execute());
        console.groupEnd();

    }
}

type ContextEntity = ContextJSON;
// {
//     id: number,
//     // Access: Array<AccessRule>,
//     Sorting: string,
//     UpdatedAt?: string;
//     Permutation?: any,
//     IsRoot: boolean,
// };
type MessageEntity = MessageJSON;
// {
//     Content: string;
//     Description?: string;
//     AuthorURI?: string;
//     CreatedAt?: string;
//     Action?: string;
//     UpdatedAt?: string;
//     ContextId: number;
//     SubContextId: number;
//     id: number;
// }
