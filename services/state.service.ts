import {Context, DomainState, Message} from "@model";
import {IDomainActions} from "@domain";
import {ProxyProvider} from "./proxy-provider.service";
import {ulid} from "ulid";
import {IFactory, Model} from "@common/domain/worker";
import {Injectable, utc} from "@common/core";
import {ContextModel} from "@domain/model";

@Injectable()
export class StateService {

    constructor(
        private factory: IFactory<Model<DomainState, IDomainActions>>,
        private proxyProvider: ProxyProvider,
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
    }

    async CreateSubContext(message: Message) {
        // if (context.URI && this.State.has(context.URI))/**/
        //     return;
        const subContext = {
            id: ulid(),
            Messages: [],
            Parents: [message],
            Storage: message.Context.Storage,
            UpdatedAt: utc(),
            CreatedAt: utc(),
            IsRoot: false,
            URI: undefined
        };
        subContext.URI = `${message.Context.URI.split('/').slice(0, -1).join('/')}/${subContext.id}`;
        message.SubContext = subContext;
        await this.CreateContext(subContext);
        //
        // this.ContextStore.Create(message.SubContext)
        //     .then(x => this.proxyProvider.GetMessageProxy(message))
        //     .then(proxy => proxy.Actions.Attach(message.SubContext.URI))
        //     .catch(console.log);
        // this._subject$.next();
    }

    async AttachContext(context: Context, to: Message) {
        await this.proxyProvider.GetMessage(to).Actions.Attach(context.URI);
    }

    public async AddMessage(message: Message) {
        await Promise.resolve();
        const proxy = await this.proxyProvider.GetContext(message.Context.URI);
        proxy.Actions.CreateMessage(message);
    }

    public MoveMessage(message: Message, to: Context, toIndex: number = to.Messages.length): void {
        const fromURI = message.Context.URI;
        this.proxyProvider.GetMessage(message).Actions.Move(fromURI, to.URI, toIndex);
    }

    public DeleteMessage(message: Message) {
        message.Context.Messages.remove(message);
        this.proxyProvider.GetContext(message.Context.URI).Actions.RemoveMessage(message.id);
    }

    public Reorder(message: Message, newIndex: number): void {
        message.Context.Messages.remove(message);
        message.Context.Messages.splice(newIndex, 0, message);
        message.Context.Messages.remove(message);
        this.proxyProvider.GetMessage(message).Actions.Reorder(newIndex);
    }

    public async UpdateContent(message: Message, content: any) {
        await Promise.resolve();
        message.Content = content;
        this.proxyProvider.GetMessage(message).Actions.UpdateText(content);
        // .then(proxy => proxy.Actions.UpdateText(message.Content))
        // .catch(err => {
        //     console.log(err);
        // })
        // this.eventBus.Notify('OnUpdateContent', message, content);
    }

    public async LoadStorageForContext(uri: string): Promise<string> {

        await this.factory.Root.Actions.LoadContext(uri);
        return uri;
    }

    public getContext(uri: string): ContextModel {
        return uri && this.proxyProvider.GetContext(uri);
    }
}

