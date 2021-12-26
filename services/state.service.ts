import * as h from "@hypertype/core";
import {BehaviorSubject, filter, first, Fn, DateTime, Injectable, map, Observable, shareReplay, tap, utc} from "@hypertype/core";
import {Context, DomainState, Message, Storage} from "@model";
import {LogService} from "./log.service";
import {DomainProxy, IDomainActions} from "@domain";
import {ProxyProvider} from "./proxy-provider.service";
import {ulid} from "ulid";
import {AccountManager} from "./account.manager";
import {IFactory, Model} from "@common/domain";
import type {DomainModel} from "@domain/model";

@Injectable()
export class StateService {

    constructor(
        private factory: IFactory<Model<DomainState, IDomainActions>>,
        private proxyProvider: ProxyProvider,
        private accManager: AccountManager,
        private logService: LogService
    ) {
        // this.domainProxy.State$.subscribe(x => console.log('storage', x.Storages[0]));
        // @ts-ignore
        window.state = this;
    }

    // public StorageStore = new StorageStore(this.proxyProvider);
    // public ContextStore = new ContextStore(this.StorageStore, this.proxyProvider);
    // public MessagesStore = new MessageStore(this.StorageStore, this.ContextStore, this.proxyProvider);


    async CreateContext(context: Context) {
        await this.factory.Root.Actions.CreateContext(context);
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
        };
        message.SubContext.URI = `${message.Context.URI.split('/').slice(0,-1).join('/')}/${message.SubContext.id}`;
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
        const proxy = await this.proxyProvider.GetContextProxy(message.Context);
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
            .then(proxy => proxy.Actions.RemoveMessage(message.id))
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

    public async LoadStorageForContext(uri: string): Promise<string> {
        // const existed = this.StorageStore.getByURI(uri);
        // if (existed) return uri;
        if (!uri) {
            const accounts = await this.accManager.Accounts$.pipe(filter(x => x.length > 0), first()).toPromise();
            const defaultStorage = accounts[0].defaultStorage;
            await this.factory.Root.Actions.LoadContext(defaultStorage);
            history.replaceState(null, defaultStorage, `${location.href}${btoa(defaultStorage).replaceAll('=','')}`)
            return defaultStorage;
        }
        await this.factory.Root.Actions.LoadContext(uri);
        return uri;
    }

    // @ts-ignorem
    private _subject$ = new BehaviorSubject<void>();

    //
    public getContext$(uri: string): Observable<Context> {
        return this.State$.pipe(
            // tap(x => console.log('root:', x)),
            filter(Fn.Ib),
            map(x => x.Contexts.get(uri)),
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


    public State$: Observable<DomainState> = new Observable<DomainState>(subscr => {
        this.factory.Root.$state.subscribe((err, evt) => subscr.next(evt.data.value));
    })

}

