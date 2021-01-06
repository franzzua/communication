import {Injectable, switchThrottle, utc} from "@hypertype/core";
import {ContextCollection} from "./data/context.collection";
import {Context, Message, Storage} from "@model";
import {MessageEntity} from "@infr/solid/data/message.entity";
import {ContextDocument} from "@infr/solid/data/context.document";
import {DomainEventsListener, EventBus, IAccountInfo, StateService, StorageService} from "@services";
import {ISession, useFetch, useSession} from "solidocity";

useFetch(fetch);

@Injectable()
export class SolidRepository implements DomainEventsListener {

    public EventBus = new EventBus();
    private notificator: DomainEventsListener = this.EventBus.Notificator;

    constructor(private stateService: StateService,
                private storageService: StorageService) {
    }


    private StorageMap = new Map<string, ContextCollection>();
    private ContextMap = new Map<string, ContextDocument>();
    private MessageMap = new Map<string, MessageEntity>();

    private async LoadStorage(storage: Storage) {
        const collection = new ContextCollection(storage.URI);
        await collection.Init();
        const contexts = [];
        if (collection.Contexts.Documents.length == 0) {
            await collection.Contexts.Create('root.ttl');
        }
        for (const x of collection.Contexts.Documents) {
            await x.Init();
            x.on('update', ({reference}) => {
                console.log('context changed', reference)
                this.notificator.OnContextChanged(reference);
            })
            const context = new Context();
            context.Storage = storage;
            context.URI = x.URI;
            this.ContextMap.set(context.URI, x);
            contexts.push(context);
            if (context.URI == `${storage.URI}/root.ttl`) {
                storage.Root = context;
            }
        }
        for (let [contextURI, document] of this.ContextMap) {
            for (const messageEntity of document.Messages.Items) {
                const message = new Message();
                message.CreatedAt = utc(messageEntity.Time);
                message.Content = messageEntity.Content;
                message.Context = contexts.find(y => y.URI == contextURI);
                message.Context.Messages.push(message);
                message.URI = messageEntity.Id;
                message.id = messageEntity.Id;
                this.MessageMap.set(message.id, messageEntity);
            }
        }
        this.StorageMap.set(storage.URI, collection);
    }

    public async CreateDefaultStorage(session) {
        const storage = new Storage();
        storage.URI = `${new URL(session.webId).origin}/context`;
        await this.LoadStorage(storage);
        await this.stateService.Load(storage.Root);
        return storage;
    }

    async OnAttachContext(message, context) {
        // const messageEntity = this.MessageMap.get(message.Content);
        // messageEntity.Context = context.URI;
        // messageEntity.Save();
    }

    async OnAddMessage(message: Message) {
        if (message.URI)
            return;
        const contextDocument = this.ContextMap.get(message.Context.URI);
        const messageEntity = contextDocument.Messages.Add();
        // messageEntity.Author = message.Author.URI;
        messageEntity.Content = message.Content;
        messageEntity.Time = message.CreatedAt.toJSDate();
        messageEntity.Save();
        message.URI = messageEntity.Id;
        this.MessageMap.set(message.id, messageEntity);
        this.SaveDocs();
    }

    @switchThrottle(1000, {leading: false, trailing: true})
    private async SaveDocs(){
        for (let doc of this.ContextMap.values()){
            await doc.Save();
        }
    }

    async MoveMessage({Message, NewContext}) {

    }

    async OnDeleteMessage(message: Message) {
        if (!message.URI)
            return;
        const contextDocument = this.ContextMap.get(message.Context.URI);
        contextDocument.Messages.Remove(this.MessageMap.get(message.id));
        this.SaveDocs();
    }

    async OnUpdateContent(message: Message, content: any) {
        const messageEntity = this.MessageMap.get(message.id);
        messageEntity.Content = content;
        messageEntity.Save();
        this.SaveDocs();
    }

    async OnCreateContext(context: Context) {
        if (context.URI)
            return;
        const collection = this.StorageMap.get(context.Storage.URI);
        const contextEntity = await collection.Contexts.Create(context.URI);
        this.ContextMap.set(context.URI, contextEntity);
    }

    async onNewContext(context: Context) {
        this.notificator.OnContextChanged(context.URI);
    }

    async OnNewAccount(account: IAccountInfo) {
        if (account.type != 'solid')
            return;
        const session = account.session as ISession;
        await useSession(session);
        try {
            const storage = await this.CreateDefaultStorage(session);
            await this.storageService.AddStorage(storage);
        } catch (e) {
            console.error(e);
        }
    }
}

