import * as h from "@hypertype/core";
import {BehaviorSubject, Injectable, map, Observable, shareReplay, tap, utc} from "@hypertype/core";
import {Context, Message, Storage} from "@model";
import {LogService} from "./log.service";
import {DomainProxy} from "@domain";
import {ProxyProvider} from "./proxy-provider.service";
import {StorageStore} from "./stores/storage-store";
import {MessageStore} from "./stores/message-store";
import {ContextStore} from "./stores/context-store";
import {ulid} from "ulid";

class AsyncQueueStore {

}

@Injectable()
export class StateService {

    constructor(
        private domainProxy: DomainProxy,
        private proxyProvider: ProxyProvider,
        private logService: LogService
    ) {

        // @ts-ignore
        window.State = this;
    }

    public StorageStore = new StorageStore(this.proxyProvider);
    public MessagesStore = new MessageStore(this.StorageStore, this.proxyProvider);
    public ContextStore = new ContextStore(this.StorageStore, this.MessagesStore, this.proxyProvider);


    async CreateContext(context: Context) {
        // if (context.URI && this.State.has(context.URI))/**/
        //     return;
        this.ContextStore.Create(context).catch(console.log);
        this._subject$.next();
    }

    CreateSubContext(message: Message) {
        // if (context.URI && this.State.has(context.URI))/**/
        //     return;
        message.SubContext = {
            id: ulid(),
            Messages: [],
            Parents: [message],
            Storage: message.Context.Storage,
        } as Context;
        this.ContextStore.Create(message.SubContext).catch(console.log);
        this._subject$.next();
    }

    async AttachContext(contextId: string, to: Message) {
        const subContext = this.ContextStore.getById(contextId);
        const existed = this.MessagesStore.getById(to.id);
        if (!existed)
            throw new Error("Attach context to unknown message");
        if (!subContext)
            throw new Error("Attach not loaded context to message");
        existed.SubContext = subContext;
        this._subject$.next();
        (await this.proxyProvider.GetMessageProxy(to))
            .Actions.Attach(contextId)
            .catch(err => console.log(err));
    }

    public AddMessage(message: Message) {
        this.MessagesStore.Create(message).catch(console.log);
        this._subject$.next();
    }

    public MoveMessage(message: Message, to: Context, toIndex: number = to.Messages.length): void {
        message.Context.Messages.remove(message);
        to.Messages.splice(toIndex, 0, message);
        message.Context = to;
        Promise.all([this.proxyProvider.GetContextProxy(message.Context), this.proxyProvider.GetContextProxy(to)])
            .then(() => this.proxyProvider.GetMessageProxy(message))
            .then(proxy => proxy.Actions.Move(message.Context.URI, to.URI, toIndex))
    }

    public DeleteMessage(message: Message) {
        message.Context.Messages.remove(message);
        this.proxyProvider.GetMessageProxy(message)
            .then(() => this.proxyProvider.GetContextProxy(message.Context))
            .then(proxy => proxy.Actions.RemoveMessage(message.URI))
            .catch(err => console.log(err));
    }

    public Reorder(message: Message, newIndex: number): void {
        message.Context.Messages.remove(message);
        message.Context.Messages.splice(newIndex, 0, message);
        message.Context.Messages.remove(message);
        this.proxyProvider.GetMessageProxy(message)
            .then(proxy => proxy.Actions.Reorder(newIndex))
            .catch(err => console.log(err));
    }

    public UpdateContent(message: Message, content: any) {
        message.Content = content;
        this._subject$.next();
        this.proxyProvider.GetMessageProxy(message)
            .then(proxy => proxy.Actions.UpdateText(message.Content))
            .catch(err => {
                console.log(err);
            })
        // this.eventBus.Notify('OnUpdateContent', message, content);
    }

    public async LoadStorage(uri: string): Promise<string> {
        const existed = this.StorageStore.getByURI(uri);
        if (existed) return uri;
        const type = uri.startsWith('local') ? 'local' : 'solid';
        await this.domainProxy.Actions.CreateStorage({
            URI: uri,
            Messages: [],
            Contexts: [],
            Type: type
        });
        return uri;
    }

    // @ts-ignore
    private _subject$ = new BehaviorSubject<void>();


    public getContext$(uri: string): Observable<Context> {
        return this.State$.pipe(
            map(x => x.Contexts.get(uri)),
        );
    }

    private DomainState$: Observable<void> = this.domainProxy.State$.pipe(
        h.map(model => {
            for (const storageState of model.Storages) {
                this.StorageStore.SetOrUpdate(storageState);
                storageState.Messages.forEach(m => this.MessagesStore.SetOrUpdate(m));
                storageState.Contexts.forEach(m => this.ContextStore.SetOrUpdate(m));
            }
        })
    )


    public State$: Observable<{
        Contexts: Map<string, Context>,
        Messages: Map<string, Message>,
        Storages: Map<string, Storage>,
    }> = h.merge(
        this._subject$.asObservable(),
        this.DomainState$,
    ).pipe(
        map(s => ({
            Contexts: this.ContextStore.State,
            Messages: this.MessagesStore.State,
            Storages: this.StorageStore.State,
        })),
        shareReplay(1),
    );

}

