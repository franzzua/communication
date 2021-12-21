import {Map as YMap} from "yjs";
import {ContextJSON, MessageJSON} from "@domain";
import {from, map, merge, shareReplay} from "@hypertype/core";
import {fromYjs, YjsStore} from "@infr/y/yjsStore";


export class ContextStore extends YjsStore {

    private contextMap = this.doc.getMap('context');

    private messageArray = this.doc.getArray<YMap<any>>('messages');

    public State$ = merge(
        fromYjs(this.contextMap),
        fromYjs(this.messageArray),
        from(this.IsLoaded$),
    ).pipe(
        map((event) => {
            console.log(event);
            return {
                Context: this.readContext(),
                Messages: this.readMessages()
            }
        }),
        shareReplay(1)
    )

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
}

