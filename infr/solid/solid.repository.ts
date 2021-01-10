import {Injectable, switchThrottle, utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {Context, Message, Storage} from "@model";
import {MessageEntity} from "@infr/solid/data/message.entity";
import {ContextDocument} from "@infr/solid/data/context.document";
import {DomainEventsListener, EventBus, IAccountInfo, StateService, StorageService} from "@services";
import type {ISession} from "solidocity";
import {useSession} from "solidocity";


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
    private ContextMap = new Map<string, ContextDocument>();
    private MessageMap = new Map<string, MessageEntity>();

    private ChangedDocs = new Set<ContextDocument>();

    public async Unload(storage: Storage){
        const collection = this.StorageMap.get(storage.URI);
        await collection.Unsubscribe();
    }

    public async LoadStorage(storage: Storage, clean = false) {
        const collection = new ContextCollection(storage.URI);
        if (clean){
            await collection.Init();
            await collection.Remove();
        }
        await collection.Init();
        const contexts = [];
        if (collection.Contexts.Documents.length == 0) {
            await collection.Contexts.Create('root.ttl');
        }
        for (const x of collection.Contexts.Documents) {
            await x.Init();
            x.on('update', ({reference}) => {
                this.notificator.OnContextChanged(reference);
            })
            const context = new Context();
            context.Storage = storage;
            context.URI = x.URI;
            context.id = x.URI;
            this.ContextMap.set(context.id, x);
            contexts.push(context);
            if (context.URI == `${storage.URI}/root.ttl`) {
                storage.Root = context;
            }
        }
        for (const x of collection.Contexts.Documents) {
            for (const messageEntity of x.Messages.Items) {
                const message = new Message();
                message.CreatedAt = utc(messageEntity.Time);
                message.Content = messageEntity.Content;
                message.Context = contexts.find(y => y.URI == x.URI);
                message.Context.Messages.push(message);
                if (messageEntity.SubContext) {
                    message.SubContext = contexts.find(y => y.URI == messageEntity.SubContext);
                }
                message.URI = messageEntity.Id;
                message.id = messageEntity.Id;
                this.MessageMap.set(message.id, messageEntity);
            }
        }
        this.StorageMap.set(storage.URI, collection);
    }

    public async CreateDefaultStorage(session, clean = false) {
        const storage = new Storage();
        storage.URI = `${new URL(session.webId).origin}/context`;
        await this.LoadStorage(storage, clean);
        await this.stateService.Load(storage.Root);
        return storage;
    }

    async OnAttachContext(contextURI: string, message: Message) {
        if (this.ContextMap.has(contextURI))
            contextURI = this.ContextMap.get(contextURI).URI;
        const messageEntity = this.MessageMap.get(message.id);
        messageEntity.SubContext = contextURI;
        this.SaveDocs();
    }

    async OnAddMessage(message: Message) {
        if (message.URI)
            return;
        const contextDocument = this.ContextMap.get(message.Context.id);
        await contextDocument.Loading;
        const messageEntity = contextDocument.Messages.Add();
        // messageEntity.Author = message.Author.URI;
        messageEntity.Content = message.Content;
        messageEntity.Time = message.CreatedAt.toJSDate();
        message.URI = messageEntity.Id;
        this.MessageMap.set(message.id, messageEntity);
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
        const contextDocument = this.ContextMap.get(message.Context.id);
        contextDocument.Messages.Remove(this.MessageMap.get(message.id));
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
    }

    async OnUpdateContent(message: Message, content: any) {
        const contextDocument = this.ContextMap.get(message.Context.id);
        const messageEntity = this.MessageMap.get(message.id);
        messageEntity.Content = content;
        this.ChangedDocs.add(contextDocument);
        this.SaveDocs();
    }

    async OnCreateContext(context: Context) {
        const collection = this.StorageMap.get(context.Storage.URI);
        const contextDocument = await collection.Contexts.Create(`${context.id || +utc()}.ttl`);
        context.URI = contextDocument.URI;
        this.ContextMap.set(context.id, contextDocument);
        return context;
    }

    async onNewContext(context: Context) {
        this.notificator.OnContextChanged(context.URI);
    }

    async OnNewAccount(account: IAccountInfo, clean = false) {
        if (account.type != 'solid')
            return;
        const session = account.session as ISession;
        await useSession(session);
        const storage = await this.CreateDefaultStorage(session, clean);
        await this.storageService.AddStorage(storage);
        return storage;
    }

    async Clean() {

    }
}

