import {ObservableYMapBase} from "./observable-y-map-base";

export class ObservableYMap<TValue> extends ObservableYMapBase<TValue, {
    change: { oldValue: TValue, value: TValue, key: string, type: 'add' | 'delete' | 'update' },
}> implements Map<string, TValue> {
    get size(): number {
        return this.yMap.size;
    }

    clear(): this {
        this.yMap.clear();
        this.emit('change', null);
        return this;
    }

    protected emitChange(type: 'add' | 'update' | 'delete', key, value, prev) {
        this.emit('change', {
            type,
            key,
            oldValue: prev,
            value
        });
    }

    has(key: string) {
        return this.yMap.has(key);
    }

    get(key: string) {
        return this.yMap.get(key);
    }

    delete(key: string): boolean {
        const has = this.yMap.has(key);
        const prev = this.yMap.get(key);
        this.yMap.delete(key);
        this.emitChange('delete', key, null, prev);
        return has;
    }

    set(key: string, value: TValue) {
        const has = this.yMap.has(key);
        const prev = this.yMap.get(key);
        this.yMap.set(key, value);
        this.emitChange(has ? 'update' : 'add', key, value, prev);
        return this;
    }

    keys() {
        return this.yMap.keys();
    }

    values(): IterableIterator<TValue> {
        return this.yMap.values();
    }

    entries(): IterableIterator<[string, TValue]> {
        return this.yMap.entries();
    }

    [Symbol.iterator] = () => {
        return this.entries();
    }

    toMap(): Map<string, TValue> {
        return new Map(this.entries());
    }

    readonly [Symbol.toStringTag]: string = 'ObservableYMap'

    forEach(callbackfn: (value: TValue, key: string, map: Map<string, TValue>) => void, thisArg?: any): void {
        this.yMap.forEach((value, key) => {
            callbackfn(value,key, this as Map<string, TValue>);
        })
    }

    getOrAdd = Map.prototype.getOrAdd;
    map = Map.prototype.map;
    cast = Map.prototype.cast;
}

