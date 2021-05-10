import * as h from "@hypertype/core";
import {BehaviorSubject, Injectable, map, Observable, shareReplay, tap, utc} from "@hypertype/core";
import {Context, Message, Storage} from "@model";
import {LogService} from "./log.service";
import {DomainProxy} from "@domain";
import {ProxyProvider} from "./proxy-provider.service";
import {ulid} from "ulid";

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

    // public StorageStore = new StorageStore(this.proxyProvider);
    // public ContextStore = new ContextStore(this.StorageStore, this.proxyProvider);
    // public MessagesStore = new MessageStore(this.StorageStore, this.ContextStore, this.proxyProvider);


    async CreateContext(context: Context) {
        const proxy = await this.proxyProvider.GetStorageProxy(context.Storage);
        await proxy.Actions.CreateContext(context);
        this._subject$.next();
    }

    async CreateSubContext(message: Message) {
        // if (context.URI && this.State.has(context.URI))/**/
        //     return;
        message.SubContext = {
            id: ulid(),
            Messages: [],
            Parents: [message],
            Storage: message.Context.Storage,
            UpdatedAt: utc(),
            CreatedAt: utc(),
            IsRoot: false,
            URI: undefined
        }
        await this.CreateContext(message.SubContext);
        //
        // this.ContextStore.Create(message.SubContext)
        //     .then(x => this.proxyProvider.GetMessageProxy(message))
        //     .then(proxy => proxy.Actions.Attach(message.SubContext.URI))
        //     .catch(console.log);
        // this._subject$.next();
    }

    async AttachContext(context: Context, to: Message) {
        // const subContext = this.ContextStore.getById(contextId);
        // const existed = this.MessagesStore.getById(to.id);
        // if (!existed)
        //     throw new Error("Attach context to unknown message");
        // if (!subContext)
        //     throw new Error("Attach not loaded context to message");
        // existed.SubContext = subContext;
        // this._subject$.next();
        (await this.proxyProvider.GetMessageProxy(to))
            .Actions.Attach(context.URI)
            .catch(err => console.log(err));
    }

    public async AddMessage(message: Message) {
        message.Order = message.Context.Messages.length;
        const proxy = await this.proxyProvider.GetStorageProxy(message.Context.Storage);
        await proxy.Actions.CreateMessage(message);
    }

    public MoveMessage(message: Message, to: Context, toIndex: number = to.Messages.length): void {
        const fromURI = message.Context.URI;
        // message.Context.Messages.remove(message);
        // to.Messages.splice(toIndex, 0, message);
        // message.Context = to;
        Promise.all([this.proxyProvider.GetContextProxy(message.Context), this.proxyProvider.GetContextProxy(to)])
            .then(() => this.proxyProvider.GetMessageProxy(message))
            .then(proxy => proxy.Actions.Move(fromURI, to.URI, toIndex))
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
        // const existed = this.StorageStore.getByURI(uri);
        // if (existed) return uri;

        const type = uri.startsWith('local://') ? 'local' : 'solid';
        await this.domainProxy.Actions.CreateStorage({
            URI: uri,
            Type: type,
            Root: null,
            Trash: [],
            Messages: new Map(),
            Contexts: new Map()
        });
        return uri;
    }

    // @ts-ignorem
    private _subject$ = new BehaviorSubject<void>();

    //
    public getContext$(uri: string): Observable<Context> {
        return this.State$.pipe(
            tap(x => console.log(x)),
            map(x => x.Root),
        );
    }
    //
    // private DomainState$: Observable<void> = this.domainProxy.State$.pipe(
    //     h.map(model => {
    //         for (const storageState of model.Storages) {
    //             this.StorageStore.SetOrUpdate(storageState);
    //             storageState.Contexts.forEach(m => this.ContextStore.SetOrUpdate(m));
    //             storageState.Messages.forEach(m => this.MessagesStore.SetOrUpdate(m));
    //         }
    //     })
    // )


    public State$: Observable<Storage> = this.domainProxy.State$.pipe(
        map(x => x.Storages[0]),
        shareReplay(1)
    )

}

