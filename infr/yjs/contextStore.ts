import {ContextJSON, MessageJSON} from "@domain";
import {SyncStore} from "@cmmn/sync";
import {cell, Cell} from "@cmmn/cell";
import {compare, ResolvablePromise, utc} from "@cmmn/core";
import {Context, Message} from "@model";
import {ContextMap} from "@domain/model";
import {Permutation} from "@domain/helpers/permutation";

export class ContextStore {

    private messageStore = new SyncStore<MessageJSON>(this.URI);

    // private static provider = new WebRtcProvider([`${location.origin.replace(/^http/, 'ws')}/api`])
    public Sync = new ResolvablePromise();
    @cell
    public IsSynced = false;

    constructor(protected URI: string,
                private token: Promise<string>,
                private contextMap: SyncStore<ContextJSON>) {
        this.Join();
    }

    async Join() {
        await this.contextMap.useIndexedDB();
        await this.messageStore.useIndexedDB();
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
        this.IsSynced = true;
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

    public $state = new Cell(() => {
        const state = this.GetState();
        if (!state.Context)
            return Context.FromJSON({URI: this.URI} as any);
        const context = Context.FromJSON(state.Context);
        const ordered = Array.from(state.Messages).orderBy(x => x);
        context.Messages = context.Permutation?.Invoke(ordered) ?? ordered;
        return context;
    }, {
        compare,
        onExternal: value => {
            value.Permutation = Permutation.Diff(value.Messages.orderBy(x => x), value.Messages);
            this.contextMap.Items.set(value.URI, Context.ToJSON(value));
            const existed = new Set(this.messageStore.Items.keys());
            for (let id of value.Messages) {
                if (existed.has(id)) {
                    existed.delete(id);
                    continue;
                }
                this.AddMessage({
                    id: id,
                    UpdatedAt: utc().toISO(),
                    CreatedAt: utc().toISO(),
                    Content: '',
                    ContextURI: this.URI
                });
            }
            for (let id of existed){
                this.DeleteMessage({
                    id: id
                })
            }
        }
    })

    GetMessageCell(id: string) {
        return new Cell(() => {
            if (!this.IsSynced){
                return null;
            }
            const result = this.messageStore.Items.get(id);
            return result && Message.FromJSON(result);
        }, {
            compare,
            onExternal: value => {
                this.messageStore.Items.set(value.id, Message.ToJSON(value));
            }
        });
    }
}

export type IState = {
    Context: Readonly<ContextJSON>;
    Messages: ReadonlySet<string>;
};