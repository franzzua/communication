import {Injectable, switchThrottle, utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {ContextDocument} from "@infr/solid/data/context.document";
import {EventBus} from "@services";
import {Profile} from "solidocity";
import {ContextJSON, DomainProxy, IRepository, MessageJSON, StorageJSON} from "@domain";

@Injectable()
export class SolidRepository implements IRepository {

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

    public async Init(storage: StorageJSON, clean = false): Promise<StorageJSON> {
        if (ContextCollection.Map.has(storage.URI))
            return ContextCollection.Map.get(storage.URI).ToJSON();
        const collection = new ContextCollection(storage.URI);
        if (clean){
            await collection.Init();
            await collection.Remove();
        }
        try {
            await collection.Init();
            for (let linkedStorage of collection.LinkedStorages) {
                await this.Init(linkedStorage, clean);
            }
        }catch (e){

        }
        this.StorageMap.set(storage.URI, collection);
        // await this.stateService.Load(storage.Root);
        return  collection.ToJSON();
    }

    public async CreateDefaultStorage(session, clean = false) {
        const profile = new Profile(session.webId);
        await profile.Init();
        const storage = {
            URI: `${profile.Me.Storage}context`,
            Type: 'solid',
            Contexts: [], Messages: []
        } as StorageJSON;
        await this.Init(storage, clean);
        return storage;
    }

    public UpdateContext(ctx: ContextJSON): Promise<void> {
        return Promise.resolve(undefined);
    }

    async AddMessage(message: MessageJSON) {
        const contextDocument = ContextDocument.Map.get(message.ContextURI);
        await contextDocument.Loading;
        const messageEntity = contextDocument.Messages.Add();
        // messageEntity.Author = message.Author.URI;
        messageEntity.Content = message.Content;
        messageEntity.SubContext = message.SubContextURI;
        messageEntity.Time = utc(message.CreatedAt).toJSDate();
        message.URI = messageEntity.Id;
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
        return message;
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

    async RemoveMessage(message: MessageJSON) {
        if (!message.URI)
            return;
        const contextDocument = ContextDocument.Map.get(message.ContextURI);
        contextDocument.Messages.Remove(contextDocument.Messages.get(message.URI));
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
    }

    async UpdateMessage(message: MessageJSON) {
        const contextDocument = ContextDocument.Map.get(message.ContextURI);
        const messageEntity =contextDocument.Messages.get(message.URI);
        messageEntity.Content = message.Content;
        messageEntity.SubContext = message.SubContextURI;
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
    }

    async CreateContext(context: ContextJSON) {
        const collection = this.StorageMap.get(context.StorageURI);
        const contextDocument = await collection.Contexts.Create(`${+utc()}.ttl`);
        context.URI = contextDocument.URI;
        ContextDocument.Map.set(context.URI, contextDocument);
        return context;
    }

    public async Clear() {
        for (let value of this.StorageMap.values()) {
            await value.Remove(true);
        }
        this.StorageMap.clear();
    }


}

