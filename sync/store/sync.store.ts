import {Doc, } from "yjs";
import {DocAdapter} from "../index";
import {Awareness} from "y-protocols/awareness";
import { cell, ObservableList, ObservableObject, ObservableSet} from "@cmmn/cell";
import {IndexeddbPersistence} from "y-indexeddb";

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
    public getSet<T>(name: string): ObservableSet<T>{
        const array = this.doc.getArray<T>(name);
        let remoteChange = false;
        array.observe((events, transaction) => {
            if (transaction.local)
                return;
            remoteChange = true;
            for (let added of events.changes.added) {
                if (events.changes.deleted.delete(added)){
                    continue;
                }
                // @ts-ignore
                for (let x of added.content.arr) {
                    arr.add(x)
                }
            }
            for (let deleted of events.changes.deleted) {
                // @ts-ignore
                for (let x of deleted.content.arr) {
                    arr.delete(x)
                }
            }
            remoteChange = false;
        });
        const arr = new ObservableSet<T>(array.toArray());
        arr.on('change', e => {
            if (remoteChange)
                return;
            if (e.add) {
                array.push(e.add);
            }
            if (e.delete) {
                for (let t of e.delete) {
                    while (true) {
                        let index = array.toArray().indexOf(t);
                        if (index == -1)
                            break;
                        array.delete(index, 1);
                    }
                }
            }
        })
        return arr;
    }


    public dispose(){
        this.doc.destroy();
        this.adapter.dispose();
    }
}

