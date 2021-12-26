import {Map as YMap} from "yjs";
import {ContextJSON, MessageJSON} from "@domain";
import {from, map, merge, shareReplay, tap} from "@hypertype/core";
import {fromYjs, YjsStore} from "@infr/y/yjsStore";
import {cellx} from "cellx";


export class ContextStore extends YjsStore {

    private contextMap = this.doc.getMap('context');

    private messageArray = this.doc.getArray<YMap<any>>('messages');

    public State$ = merge(
        fromYjs(this.contextMap),
        fromYjs(this.messageArray),
        from(this.IsLoaded$),
        from(this.IsSynced$),
    ).pipe(
        map((event) => {
            console.log(event);
            return this.GetState();
        }),
        tap(state => this.State(state)),
        tap(console.log),
        shareReplay(1)
    )

    subscr2 = this.State$.subscribe();

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

    private readMessages(): MessageJSON[] {
        return this.messageArray.toArray().map(yMap => yMap.toJSON());
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

    State = cellx(this.GetState());

    subscr = this.State.subscribe((err, data) => {
        const { value} = data.data as { prevValue: IState, value: IState };
        const prevValue = this.GetState();
        this.doc.transact(() => {
            if (value.Context.UpdatedAt && prevValue.Context.UpdatedAt !== value.Context.UpdatedAt) {
                this.UpdateContext(value.Context);
                console.log('update context', value.Context.id);
            }
            const toDelete = new Map(prevValue.Messages.map(x => [x.id, x]));
            for (let message of value.Messages) {
                const old = toDelete.get(message.id)
                if (old) {
                    toDelete.delete(message.id);
                    if (message.UpdatedAt && message.UpdatedAt !== old.UpdatedAt) {
                        this.UpdateMessage(message);
                        console.log('update message', message.id);
                    }
                } else {
                    console.log('add message', message.id);
                    this.AddMessage(message);
                }
            }
            for (let message of toDelete.values()) {
                this.DeleteMessage(message);
                console.log('delete message', message.id);
            }
        });
    })

    GetState(): IState {
        return {
            Context: this.readContext(),
            Messages: this.readMessages()
        }
    }
}

export type IState = {
    Context: Readonly<ContextJSON>;
    Messages: ReadonlyArray<Readonly<MessageJSON>>;
};