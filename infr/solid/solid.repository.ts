import {Injectable, Observable, Subject, switchThrottle, utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {ContextDocument} from "@infr/solid/data/context.document";
import {EventBus} from "@services";
import {Profile} from "solidocity";
import {ContextJSON, DomainProxy, IRepository, MessageJSON, StorageJSON} from "@domain";

@Injectable()
export class SolidRepository implements IRepository {
    public async Load(storageURI: string): Promise<StorageJSON> {
        const collection = this.StorageMap.get(storageURI);
        if (!collection)
            throw new Error(`storage not loaded yet`);
        return collection.ToJSON();
    }

    public EventBus = new EventBus();

    constructor() {
        window.addEventListener('beforeunload', () => {
            this.SaveDocsNow()
        })
    }

    private StorageMap = new Map<string, ContextCollection>();
    // private ContextMap = new Map<string, ContextDocument>();
    // private MessageMap = new Map<string, MessageEntity>();

    private ChangedDocs = new Set<ContextDocument>();

    public async Unload(storage: Storage){
        const collection = this.StorageMap.get(storage.URI);
        await collection.Unsubscribe();
    }

    public async Subscribe(storage: StorageJSON, clean = false): Promise<void> {
        if (ContextCollection.Map.has(storage.URI))
            return;
        const collection = new ContextCollection(storage.URI);
        if (clean){
            await collection.Init();
            await collection.Remove();
        }
        try {
            await collection.Init();
            for (let linkedStorage of collection.LinkedStorages) {
                await this.Subscribe(linkedStorage, clean);
            }
        }catch (e){

        }
        this.StorageMap.set(storage.URI, collection);
        // await this.stateService.Load(storage.Root);
        this._onNewStateSubject$.next(collection.ToJSON());
    }

    public async CreateDefaultStorage(session, clean = false) {
        const profile = new Profile(session.webId);
        await profile.Init();
        const storage = {
            URI: `${profile.Me.Storage}context`,
            Type: 'solid',
            Contexts: [], Messages: []
        } as StorageJSON;
        await this.Subscribe(storage, clean);
        return storage;
    }


    public Contexts = {
        Create: async (context: ContextJSON) =>{
            const collection = this.StorageMap.get(context.StorageURI);
            const contextDocument = await collection.Contexts.Create(`${+utc()}.ttl`);
            contextDocument.Context.CreatedAt = utc(context.CreatedAt).toJSDate();
            contextDocument.Context.UpdatedAt = utc(context.UpdatedAt).toJSDate();
            context.URI = contextDocument.URI;
            ContextDocument.Map.set(context.URI, contextDocument);
        },
        Update: async (changes: Partial<ContextJSON>) =>{
            const contextDocument = ContextDocument.Map.get(changes.URI);
            if ('UpdatedAt' in changes)
                contextDocument.Context.UpdatedAt = utc(changes.UpdatedAt).toJSDate();
            if ('CreatedAt' in changes)
                contextDocument.Context.CreatedAt = utc(changes.CreatedAt).toJSDate();
            if ('Permutation' in changes)
                contextDocument.Context.Permutation = changes.Permutation;
            this.SaveDocs();
        },
        Delete: async (context: ContextJSON) =>{
            const contextDocument = ContextDocument.Map.get(context.URI);
            await contextDocument.Remove();
        }
    }

    public Messages = {
        Create: async (message: MessageJSON) => {
            const contextDocument = ContextDocument.Map.get(message.ContextURI);
            await contextDocument.Loading;
            const messageEntity = contextDocument.Messages.Add();
            // messageEntity.Author = message.Author.URI;
            messageEntity.Content = message.Content;
            messageEntity.SubContext = message.SubContextURI;
            messageEntity.CreatedAt = utc(message.CreatedAt).toJSDate();
            messageEntity.UpdatedAt = utc(message.UpdatedAt).toJSDate();
            message.URI = messageEntity.Id;
            this.ChangedDocs.add(contextDocument);
            this.SaveDocs();
        },
        Update: async (changes: Partial<MessageJSON>) => {
            const contextDocument = ContextDocument.Map.get(changes.ContextURI);
            const messageEntity =contextDocument.Messages.get(changes.URI);
            if ('Content' in changes)
                messageEntity.Content = changes.Content;
            if ('SubContextURI' in changes)
                messageEntity.SubContext = changes.SubContextURI;
            if ('UpdatedAt' in changes)
                messageEntity.UpdatedAt = utc(changes.UpdatedAt).toJSDate();
            if ('Order' in changes)
                messageEntity.Order = changes.Order;
            this.ChangedDocs.add(contextDocument);
            this.SaveDocs();
        },
        Delete: async (message: MessageJSON) => {
            if (!message.URI)
                return;
            const contextDocument = ContextDocument.Map.get(message.ContextURI);
            contextDocument.Messages.Remove(contextDocument.Messages.get(message.URI));
            this.ChangedDocs.add(contextDocument);
            this.SaveDocs();
        }
    }

    public UpdateContext(ctx: ContextJSON): Promise<void> {
        return Promise.resolve(undefined);
    }

    @switchThrottle(1000, {leading: false, trailing: true})
    public async SaveDocs() {
        this.SaveDocsNow()
    }

    private SaveDocsNow(){
        for (let doc of this.ChangedDocs) {
            for (let item of doc.Messages.Items) {
                item.Save();
            }
            doc.Save();
        }
        this.ChangedDocs.clear();
    }

    public async Clear() {
        for (let value of this.StorageMap.values()) {
            await value.Remove(true);
        }
        this.StorageMap.clear();
    }

    private _onNewStateSubject$ = new Subject<StorageJSON>();
    public State$ = this._onNewStateSubject$.asObservable();
}

