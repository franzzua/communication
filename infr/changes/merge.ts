import {ContextJSON, MessageJSON, StorageJSON} from "@domain";
import { utc } from "@hypertype/core";
import {Change} from "@infr/changes/changes-storage";
import {ulid} from "ulid";

export function mergeChanges(localChanges: Change[], remoteChanges: Change[]){
    const keys = [
        ...localChanges.map(x => x.Entity.id),
        ...remoteChanges.map(x => x.Entity.id),
    ].distinct();

    for (let key of keys) {
        const local = localChanges.filter(x => x.Entity.id == key);
        const remote = remoteChanges.filter(x => x.Entity.id == key);
        if (local.length == 0 || remote.length == 0)
            continue;

        if (local.some(x => x.Action == "Create")){
            remoteChanges.removeAll(x => x.Entity.id == key);
            continue;
        }
        if (local.some(x => x.Action == "Delete")){
            remoteChanges.removeAll(x => x.Entity.id == key);
            continue;
        }
        if (remote.some(x => x.Action == "Create")){
            localChanges.removeAll(x => x.Entity.id == key);
            continue;
        }
        if (remote.some(x => x.Action == "Delete")){
            localChanges.removeAll(x => x.Entity.id == key);
            continue;
        }

        const update = [
            ...local,
            ...remote
        ].orderBy(x => x.ulid).reduce((aggr, change) => ({...aggr, ...change}));
        remoteChanges.removeAll(x => x.Entity.id == key);
        localChanges.removeAll(x => x.Entity.id == key);

        remoteChanges.push(update);
        localChanges.push(update);
    }
}

export function mergeStorages(local: StorageJSON, remote: StorageJSON){
    const messageChanges = mergeArrays(
        new Map(remote.Messages.map(x => [x.id, x])),
        new Map(local.Messages.map(x => [x.id, x])),
        'Messages'
    );
    const contextChanges = mergeArrays(
        new Map(remote.Contexts.map(x => [x.id, x])),
        new Map(local.Contexts.map(x => [x.id, x])),
        'Contexts'
    );
    return [
        ...contextChanges,
        ...messageChanges,
    ]
}

export function mergeArrays<TItem extends ContextJSON | MessageJSON>(remote: Map<any, TItem>, local: Map<any, TItem>, type: 'Contexts'| 'Messages'): Change[]{
    const changes: Change[] = [];
    // const removed: TItem[] = [];
    // const changes = new Map<TItem, Partial<TItem>>();
    for (let [key, value] of remote) {
        if (!local.has(key)) {
            changes.push({
                Entity: value,
                Action: 'Create',
                Type: type,
                ulid: ulid()
            });
            continue;
        }
        const existed = local.get(key);
        local.delete(key);
        const change: Partial<TItem> = {};
        let changed = false;
        const keys = new Set([...Object.getOwnPropertyNames(value), ...Object.getOwnPropertyNames(existed)]);
        for (let key of keys){
            if (existed[key] != value[key]) {
                changed = true;
                change[key] = value[key];
            }
        }
        if (changed){
            changes.push({
                Entity: value,
                Action: 'Update',
                Change: change,
                Type: type,
                ulid: ulid(+utc(value.UpdatedAt ?? value.CreatedAt))
            } as Change)
        }
    }
    const deleted: TItem[] = [...local.values()];
    for (let value of deleted) {
        changes.push({
            Entity: value,
            Action: 'Delete',
            Type: type,
            ulid: ulid(+utc(value.UpdatedAt))
        })
    }
    return changes;
}
