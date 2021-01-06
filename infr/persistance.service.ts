import {Context, Message} from "@model";
import {ContextSync} from "./rtc/context.sync";
import {SolidRepository} from "./solid";
import {DomainEventsListener, EventBus, IAccountInfo, StateService} from "../services";
import {Injectable, merge} from "@hypertype/core";

@Injectable()
export class PersistanceService implements DomainEventsListener {
    private SyncMap = new Map<string, ContextSync>();

    private Notificator = this.eventBus.getNotificator(this);

    constructor(private solid: SolidRepository,
                private eventBus: EventBus,
                private state: StateService) {
    }

    public GetSyncContext(uri: string) {
        if (this.SyncMap.has(uri))
            return this.SyncMap.get(uri);
        const sync = new ContextSync(uri);
        sync.EventBus.Subscribe({
            OnUpdateContent: async (message: Message, content: any) => {
                await this.Notificator.OnUpdateContent(message, content);
                if (sync.IsMaster) {
                    await this.solid.OnUpdateContent(message, content);
                }
            },
            OnDeleteMessage: async (message: Message) => {
                await this.Notificator.OnDeleteMessage(message);
                if (sync.IsMaster) {
                    await this.solid.OnDeleteMessage(message);
                }
            },
            OnAddMessage: async (message: Message) => {
                await this.Notificator.OnAddMessage(message);
                if (sync.IsMaster) {
                    await this.solid.OnAddMessage(message);
                }
            },
            OnCreateContext: async (context: Context) => {
                await this.Notificator.OnCreateContext(context);
                if (sync.IsMaster) {
                    await this.solid.OnCreateContext(context);
                }
            }
        }).subscribe();
        this.SyncMap.set(uri, sync);
        return sync;
    }

    public async OnUpdateContent(message: Message, content: any) {
        const sync =  this.GetSyncContext(message.Context.URI);
        sync.Load(message.Context);
        sync.UpdateContent(message, content);
        // await this.state.OnUpdateContent(message, content);
        if (sync.IsMaster) {
            await this.solid.OnUpdateContent(message, content);
        }
    }

    public async OnAddMessage(message: Message){
        const sync =  this.GetSyncContext(message.Context.URI);
        sync.Load(message.Context);
        sync.AddMessage(message);
        // await this.state.OnUpdateContent(message, content);
        if (sync.IsMaster) {
            await this.solid.OnAddMessage(message);
        }
    }

    public async OnDeleteMessage(message: Message){
        const sync =  this.GetSyncContext(message.Context.URI);
        sync.Load(message.Context);
        sync.DeleteMessage(message);
        // await this.state.OnUpdateContent(message, content);
        if (sync.IsMaster) {
            await this.solid.OnDeleteMessage(message);
        }
    }

    public async OnNewAccount(info: IAccountInfo) {
        switch (info.type) {
            case "solid":
                await this.solid.OnNewAccount(info);
        }
    }

    public Actions$ = merge(
        this.solid.EventBus.Subscribe({
            OnContextChanged: (uri: string) => {
                /// context changed from somebody else
                const sync = this.GetSyncContext(uri);
            }
        }),
        this.eventBus.Subscribe(this)
    );

}