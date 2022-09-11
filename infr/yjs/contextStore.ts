import {ContextJSON, MessageJSON} from "@domain";
import {SyncStore} from "@cmmn/sync";
import {Cell} from "@cmmn/cell";
import {ResolvablePromise, utc} from "@cmmn/core";


export class ContextStore {

    private static contextMap = new SyncStore<ContextJSON>("contexts");
    private contextMap = ContextStore.contextMap;
    private messageStore = new SyncStore<MessageJSON>(this.URI);

    // private static provider = new WebRtcProvider([`${location.origin.replace(/^http/, 'ws')}/api`])
    public Sync = new ResolvablePromise();

    constructor(protected URI: string, private token: Promise<string>) {
        this.Join();
    }

    async Join() {
        // await this.contextMap.useIndexedDB();
        // await this.messageStore.useIndexedDB();
        const state = this.GetState();
        if (!state.Context) {
            this.UpdateContext({
                CreatedAt: utc().toISO(),
                id: this.URI,
                URI: this.URI,
                IsRoot: true,
                UpdatedAt: utc().toISO(),
            })
        }
        this.Sync.resolve();
    }

    // public async GetRemoteProvider() {
    //     await Promise.resolve();
    //     const token = await this.token;
    //     const room = ContextStore.provider.joinRoom(this.URI, {
    //         token: token,
    //         useBroadcast: false,
    //         user: '',
    //         maxConnections: 70 + Math.floor(Math.random() * 70),
    //     });
    //     return room;
    // }

    UpdateContext(item: Partial<ContextJSON>) {
        this.contextMap.Items.set(this.URI, {
            ...this.contextMap.Items.get(this.URI),
            ...item
        });
    }

    UpdateMessage(item: Partial<MessageJSON>) {
        const existed = this.messageStore.Items.get(item.id);
        this.messageStore.Items.set(item.id, {
            ...existed,
            ...item
        });
    }

    DeleteMessage(item: Pick<MessageJSON, "id">) {
        this.messageStore.Items.delete(item.id);
    }

    AddMessage(item: MessageJSON) {
        this.messageStore.Items.set(item.id, item);
    }

    static clear() {
    }

    GetState(): IState {
        return {
            Context: this.contextMap.Items.get(this.URI),
            Messages: new Set(this.messageStore.Items.keys())
        };
    }

    ContextCell = new Cell(() => this.GetState(), {
        onExternal: value => {
            this.contextMap.Items.set(value.Context.URI, value.Context);
            const existed = new Set(this.messageStore.Items.keys());
            for (let id of value.Messages) {
                if (existed.has(id))
                    continue;
                this.AddMessage({
                    id: id,
                    UpdatedAt: utc().toISO(),
                    CreatedAt: utc().toISO(),
                    Content: '',
                    ContextURI: this.URI
                });
            }
            for (let id of existed){
                if (value.Messages.has(id))
                    continue;
                this.DeleteMessage({
                    id: id
                })
            }
        }
    });

    GetMessageCell(id: string) {
        return new Cell(() => this.messageStore.Items.get(id), {
            onExternal: value => {
                this.messageStore.Items.set(value.id, value);
            }
        });
    }
}

export type IState = {
    Context: Readonly<ContextJSON>;
    Messages: ReadonlySet<string>;
};