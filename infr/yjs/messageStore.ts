import {ContextJSON, MessageJSON} from "@domain";
import {SyncStore} from "@cmmn/sync";
import {cell, Cell} from "@cmmn/cell";
import {compare, ResolvablePromise, utc} from "@cmmn/core";
import {Context, Message} from "@model";
import {Permutation} from "@domain/helpers/permutation";

export class MessageStore extends SyncStore{

    // private static provider = new WebRtcProvider([`${location.origin.replace(/^http/, 'ws')}/api`])
    public Sync = new ResolvablePromise();
    @cell
    public IsSynced = false;

    constructor(protected URI: string) {
        super(URI);
    }
    @cell
    private messages = this.getSet<string>('messages');

    @cell
    private context = this.getObjectCell<ContextJSON>('context');


    public Init() {
        const state = this.GetState();
        if (!state.Context.URI) {
            this.context.Diff({
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
    //
    // private contextMap = this.adapter.doc.getMap('context');
    //
    //
    // UpdateMessage(item: Partial<MessageJSON>) {
    //     const existed = this.Items.get(item.id);
    //     this.Items.set(item.id, {
    //         ...existed,
    //         ...item
    //     });
    // }

    DeleteMessage(item: Pick<Message, "id">) {
        this.messages.delete(item.id);
    }

    AddMessage(item: Message) {
        this.messages.add(item.id);
        this.GetMessageCell(item.id).set(item)
    }

    static clear() {
    }

    GetState(): IState {
        return {
            Context: this.context.Value,
            Messages: this.messages
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
            this.context.Diff(Context.ToJSON(value));
            const existed = new Set(this.messages);
            for (let id of value.Messages) {
                if (existed.has(id)) {
                    existed.delete(id);
                    continue;
                }
                this.AddMessage({
                    id: id,
                    UpdatedAt: utc(),
                    CreatedAt: utc(),
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
        const obj = this.getObjectCell<MessageJSON>(id);
        obj.on('change', e => {
            cell.set(Message.FromJSON(e.value));
        });
        const cell = new Cell(() => {
            if (!this.IsSynced){
                return null;
            }
            const result = obj.Value;
            return result && Message.FromJSON(result);
        }, {
            compare,
            onExternal: value => {
                obj.Diff(Message.ToJSON(value));
            }
        });
        return cell;
    }
}

export type IState = {
    Context: Readonly<ContextJSON>;
    Messages: ReadonlySet<string>;
};