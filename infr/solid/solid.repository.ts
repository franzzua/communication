import {Injectable, switchThrottle, utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {Context, Message, Storage} from "@model";
import {MessageEntity} from "@infr/solid/data/message.entity";
import {ContextDocument} from "@infr/solid/data/context.document";
import {DomainEventsListener, EventBus, IAccountInfo, StateService, StorageService} from "@services";
import type {ISession} from "solidocity";
import {Profile} from "solidocity";

@Injectable()
export class SolidRepository implements DomainEventsListener {

    public EventBus = new EventBus();
    private notificator: DomainEventsListener = this.EventBus.Notificator;

    constructor(private stateService: StateService,
                private storageService: StorageService) {
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

    public async LoadStorage(storage: Storage, clean = false): Promise<Storage> {
        if (ContextCollection.Map.has(storage.URI))
            return ContextCollection.Map.get(storage.URI).Storage;
        const collection = new ContextCollection(storage);
        if (clean){
            await collection.Init();
            await collection.Remove();
        }
        await collection.Init();
        for (let linkedStorage of collection.LinkedStorages) {
            await this.LoadStorage(linkedStorage, clean);
        }
        await collection.Link();
        this.StorageMap.set(storage.URI, collection);
        await this.stateService.Load(storage.Root);
        await this.storageService.AddStorage(storage);
        return  storage;
    }

    public async CreateDefaultStorage(session, clean = false) {
        const profile = new Profile(session.webId);
        await profile.Init();
        const storage = new Storage();
        storage.URI = `${profile.Me.Storage}context`;
        await this.LoadStorage(storage, clean);
        return storage;
    }

    async OnAttachContext(contextURI: string, message: Message) {
        if (ContextDocument.Map.has(contextURI))
            contextURI = ContextDocument.Map.get(contextURI).URI;
        const contextDocument = ContextDocument.Map.get(message.Context.URI);
        const messageEntity = contextDocument.Messages.get(message.URI)
        messageEntity.SubContext = contextURI;
        this.ChangedDocs.add(messageEntity.Document as ContextDocument);
        this.SaveDocs();
    }

    async OnAddMessage(message: Message) {
        if (message.URI)
            return;
        const contextDocument = ContextDocument.Map.get(message.Context.id);
        await contextDocument.Loading;
        const messageEntity = contextDocument.Messages.Add();
        // messageEntity.Author = message.Author.URI;
        messageEntity.Content = message.Content;
        messageEntity.SubContext = message.SubContext?.URI;
        messageEntity.Time = message.CreatedAt.toJSDate();
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

    async MoveMessage({Message, NewContext}) {

    }

    async OnDeleteMessage(message: Message) {
        if (!message.URI)
            return;
        const contextDocument = ContextDocument.Map.get(message.Context.id);
        contextDocument.Messages.Remove(contextDocument.Messages.get(message.URI));
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
    }

    async OnUpdateContent(message: Message, content: any) {
        const contextDocument = ContextDocument.Map.get(message.Context.id);
        const messageEntity =contextDocument.Messages.get(message.URI);
        messageEntity.Content = content;
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
    }

    async OnCreateContext(context: Context) {
        const collection = this.StorageMap.get(context.Storage.URI);
        const contextDocument = await collection.Contexts.Create(`${context.id || +utc()}.ttl`);
        context.URI = contextDocument.URI;
        ContextDocument.Map.set(context.id, contextDocument);
        return context;
    }

    async onNewContext(context: Context) {
        this.notificator.OnContextChanged(context.URI);
    }

    async OnNewAccount(account: IAccountInfo, clean = false) {
        if (account.type != 'solid')
            return;
        const session = account.session as ISession;
        const storage = await this.CreateDefaultStorage(session, clean);
        return storage;
    }

    async Clean() {

    }

    async Load(uri: string) {
        if (ContextDocument.Map.has(uri))
            return;
        const collectionURI = uri.substr(0, uri.lastIndexOf('/'));
        if (this.StorageMap.has(collectionURI))
            return;
        const storage = await this.LoadStorage({
            URI: collectionURI,
            Root: null,
            Type: 'solid'
        });
        await this.storageService.AddStorage(storage);
    }
}

