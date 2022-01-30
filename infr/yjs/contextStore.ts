import {Map as YMap} from "yjs";
import {ContextJSON, MessageJSON} from "@domain";
import {YjsStore} from "@infr/yjs/yjsStore";
import {cellx, ICellx} from "@cmmn/core";
import {WebrtcProvider} from "@infr/yjs/yWebRtc";


export class ContextStore extends YjsStore {

    private contextMap = this.doc.getMap('context');

    private messageArray = this.doc.getArray<YMap<any>>('messages');

    constructor(uri: string, private token: Promise<string>) {
        super(uri);
        this.contextMap.observeDeep(() => this.State(this.GetState()))
        this.messageArray.observeDeep(() => this.State(this.GetState()));
        this.IsLoaded$.then(() => this.State(this.GetState()));
        this.IsSynced$.then(() => this.State(this.GetState()));
    }

    public async GetRemoteProvider() {
        await Promise.resolve();
        const token = await this.token;
        return new WebrtcProvider(this.URI, this.doc, {
            signaling: [`${location.origin.replace(/^http/, 'ws')}/api`],
            // If password is a string, it will be used to encrypt all communication over the signaling servers.
            // No sensitive information (WebRTC connection info, shared data) will be shared over the signaling servers.
            // The main objective is to prevent man-in-the-middle attacks and to allow you to securely use public / untrusted signaling instances.
            // password: 'very secure password',
            token,
            // Specify an existing Awareness instance - see https://github.com/yjs/y-protocols
            // awareness: new awarenessProtocol.Awareness(doc),
            maxConns: 70 + Math.floor(Math.random() * 70),
            filterBcConns: true,
            peerOpts: {}
        } as any);
    }

    UpdateContext(item: Partial<ContextJSON>) {
        this.doc.transact(() => {

            for (let key in item) {
                if (['URI', 'id'].includes(key))
                    continue;
                if (key == 'IsRoot') {
                    this.contextMap.set('IsRoot', item.IsRoot ? 'true' : '');
                }
                this.contextMap.set(key, item[key])
            }
        });
    }

    private readMessages(): Map<string, MessageJSON> {
        return new Map(this.messageArray.toArray().map(yMap => yMap.toJSON()).map(x => [x.id, x]));
    }

    private readContext(): ContextJSON {
        const json = this.contextMap.toJSON();
        return {
            ...json,
            URI: this.URI,
            id: this.URI.split('/').pop(),
            IsRoot: !!json.IsRoot
        };
    }

    UpdateMessage(item: Partial<MessageJSON>) {
        for (let map of this.messageArray) {
            if (map.get('id') != item.id)
                continue;
            this.doc.transact(tr => {
                for (let key in item) {
                    if (['id'].includes(key))
                        continue;
                    map.set(key, item[key]);
                }
            });
        }
    }

    DeleteMessage(item: MessageJSON) {
        const length = this.messageArray.length;
        for (let i = 0; i < length; i++) {
            if (this.messageArray.get(i).get('id') != item.id)
                continue;
            this.messageArray.delete(i, 1);
            return;
        }
    }

    AddMessage(item: MessageJSON) {
        const messageMap = new YMap(Object.entries(item));
        this.messageArray.push([messageMap]);
    }

    static clear() {
    }


    State: ICellx<IState> = cellx(this.GetState());

    subscr = this.State.subscribe((err, data) => {
        const {value} = data.data as { prevValue: IState, value: IState };
        this.doc.transact(() => {
            const prevContext = this.readContext();
            if (value.Context.UpdatedAt && prevContext.UpdatedAt !== value.Context.UpdatedAt) {
                this.UpdateContext(value.Context);
                console.log('update context', value.Context.id);
            }
            const prevMessages = this.readMessages();
            for (let message of value.Messages.values()) {
                const old = prevMessages.get(message.id)
                if (old) {
                    prevMessages.delete(message.id);
                    if (message.UpdatedAt && message.UpdatedAt !== old.UpdatedAt) {
                        this.UpdateMessage(message);
                        console.log('update message', message.id, message.Content);
                    }
                } else {
                    console.log('add message', message.id, message.Content);
                    this.AddMessage(message);
                }
            }
            for (let message of prevMessages.values()) {
                this.DeleteMessage(message);
                console.log('delete message', message.id, message.Content);
            }
        });
    })

    GetState(): IState {
        return {
            Context: this.readContext(),
            Messages: this.readMessages().cast<Readonly<MessageJSON>>()
        };
    }
}

export type IState = {
    Context: Readonly<ContextJSON>;
    Messages: ReadonlyMap<string, Readonly<MessageJSON>>;
};