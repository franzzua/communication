import {ContextJSON, MessageJSON} from "@domain";
import {LocalSyncProvider, SyncStore} from "@cmmn/sync";
import {WebRtcProvider} from "@cmmn/sync/webrtc/client";
import {cell, Cell} from "@cmmn/cell";
import {compare, ResolvablePromise, utc} from "@cmmn/core";
import {Context, Message} from "@model";
import {Permutation} from "@domain/helpers/permutation";
import {ResourceTokenApi} from "@infr/resource-token-api.service";

export class ContextStore extends SyncStore<MessageJSON>{

    // private static provider = new WebRtcProvider([`${location.origin.replace(/^http/, 'ws')}/api`])
    public Sync = new ResolvablePromise();
    @cell
    public IsSynced = false;

    constructor(protected URI: string,
                private api: ResourceTokenApi) {
        super(URI);
        this.Join();
    }

    private static provider = new WebRtcProvider(
        [`${location.origin.replace(/^http/, 'ws')}/api`],
    );

    async Join() {
        await this.syncWith(new LocalSyncProvider(this.URI));
        const token = await this.api.GetToken(this.URI);
        const room = await ContextStore.provider.joinRoom(this.URI, {
            token: token,
            user: this.api.GetUserInfo().id
        });
        await this.syncWith(room);

        const state = this.GetState();
        if (!state.Context.URI) {
            this.contextJSONCell.set({
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

    private contextMap = this.adapter.doc.getMap('context');


    UpdateMessage(item: Partial<MessageJSON>) {
        const existed = this.Items.get(item.id);
        this.Items.set(item.id, {
            ...existed,
            ...item
        });
    }

    DeleteMessage(item: Pick<MessageJSON, "id">) {
        this.Items.delete(item.id);
    }

    AddMessage(item: MessageJSON) {
        this.Items.set(item.id, item);
    }

    static clear() {
    }

    private contextJSONCell = this.getObjectCell<ContextJSON>('context');
    GetState(): IState {
        return {
            Context: this.contextJSONCell.get(),
            Messages: new Set(this.Items.keys())
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
            this.contextJSONCell.set(Context.ToJSON(value));
            console.log('update context', Context.ToJSON(value));
            const existed = new Set(this.Items.keys());
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
            const result = this.Items.get(id);
            return result && Message.FromJSON(result);
        }, {
            compare,
            onExternal: value => {
                this.Items.set(value.id, Message.ToJSON(value));
            }
        });
    }
}

export type IState = {
    Context: Readonly<ContextJSON>;
    Messages: ReadonlySet<string>;
};