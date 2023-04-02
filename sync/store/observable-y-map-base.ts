import {Map as YMap} from "yjs";
import {EventEmitter} from "@cmmn/core";

export abstract class ObservableYMapBase<TValue, TEvents> extends EventEmitter<TEvents> {
    constructor(protected yMap: YMap<TValue>) {
        super();
    }

    protected subscribe(eventName) {
        this.yMap.observe(this.listener);
    }

    protected unsubscribe(eventName) {
        this.yMap.unobserve(this.listener)
    }

    private listener = (event, transaction) => {
        if (event.transaction.local)
            return;
        for (let [id, change] of event.changes.keys) {
            switch (change.action) {
                case "add":
                    this.emitChange('add', id, this.yMap.get(id), change.oldValue)
                    break;
                case "delete":
                    this.emitChange('delete', id, null, change.oldValue)
                    break;
                case "update":
                    this.emitChange('update', id, this.yMap.get(id), change.oldValue)
                    break;
            }
        }
    };

    protected abstract emitChange(type: 'add' | 'update' | 'delete', key, value, prev);

}

