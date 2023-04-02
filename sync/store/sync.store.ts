import {Doc, } from "yjs";
import {DocAdapter, ObservableYMap} from "../index";
import {Awareness} from "y-protocols/awareness";
import { cell, ObservableList, ObservableObject, ObservableSet} from "@cmmn/cell";
import {IndexeddbPersistence} from "y-indexeddb";
import {ObservableMap} from "@cmmn/cell";
import {ObservableYSet} from "./observable-y-set";

export class SyncStore {
    private doc = new Doc({
        autoLoad: true
    });
    public adapter = new DocAdapter(this.doc, new Awareness(this.doc));


    constructor(protected name) {
    }

    @cell
    public IsSynced = false;

    /**
     * @deprecated use syncWith(new LocalSyncProvider(name)) instead
     */
    public async useIndexedDB() {
        const indexeddbProvider = new IndexeddbPersistence(this.name, this.doc);
        await indexeddbProvider.whenSynced;
    }

    public getObjectCell<T>(name: string): ObservableObject<T>{
        const map = this.doc.getMap(name);
        map.observe((events, transaction) => {
            if (transaction.local)
                return;
            const diff = {} as Partial<T>;
            for (let [key, change] of events.keys.entries()) {
                diff[key] = map.get(key);
            }
            cell.Diff(diff);
        });
        const cell = new ObservableObject<T>(map.toJSON() as T);
        cell.on('change', e => {
            for (let key of e.keys) {
                if (map.get(key) !== e.value[key])
                    map.set(key, e.value[key]);
            }
        });
        return cell;
    }

    public getArray<T>(name: string): ObservableList<T>{
        const map = this.doc.getMap(name);
        map.observeDeep((events, transaction) => {
            if (transaction.local)
                return;
        });
        const arr = new ObservableList<T>();
        arr.on('change', e => {

        });
        return arr;
    }
    public getMap<T>(name: string): ObservableYMap<T>{
        const map = this.doc.getMap<T>(name);
        return new ObservableYMap<T>(map);
    }
    public getSet(name: string): ObservableYSet {
        const map = this.doc.getMap<undefined>(name);
        return new ObservableYSet(map);
    }


    public dispose(){
        this.doc.destroy();
        this.adapter.dispose();
    }
}

