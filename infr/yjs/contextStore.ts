import {Map as YMap} from "yjs";
import {ContextJSON, MessageJSON} from "@domain";
import {YjsStore} from "@infr/yjs/yjsStore";
import {Cell} from "@cmmn/cell";

export class ContextStore extends YjsStore {

    private contextMap = this.doc.getMap('context');

    private messageArray = this.doc.getArray<YMap<any>>('messages');

    constructor(uri: string) {
        super(uri);
        this.contextMap.observeDeep(() => this.State.set(this.GetState()))
        this.messageArray.observeDeep(() => this.State.set(this.GetState()));
        this.IsLoaded$.then(() => this.State.set(this.GetState()));
        this.IsSynced$.then(() => this.State.set(this.GetState()));
    }

    // public State$ = merge(
    //     fromYjs(this.contextMap),
    //     fromYjs(this.messageArray),
    //     from(this.IsLoaded$),
    //     from(this.IsSynced$),
    // ).pipe(
    //     map((event) => {
    //         console.log(event);
    //         return this.GetState();
    //     }),
    //     tap(state => this.State(state)),
    //     tap(console.log),
    //     shareReplay(1)
    // )

    // subscr2 = this.State$.subscribe();

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


    State: Cell<IState> = new Cell(this.GetState());

    subscr = this.State.on('change', (data) => {
        const { value} = data;
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