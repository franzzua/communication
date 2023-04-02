import {ObservableYMapBase} from "./observable-y-map-base";

export class ObservableYSet extends ObservableYMapBase<boolean, {
    change: {value, type: 'add' | 'delete'}
}> implements Set<string>{
    readonly [Symbol.toStringTag]: string = 'ObservableYSet';

    add(value: string): this {
        this.yMap.set(value, true);
        this.emitChange('add', value);
        return this;
    }

    [Symbol.iterator](){
        return this.yMap.keys();
    }

    forEach(cb: (key: string, value2: string, map: Set<string>) => void) {
        for (let x of this.yMap) {
            cb(x[0], x[0], this as Set<string>);
        }
    }

    protected emitChange(type: "add" | "update" | "delete", key, value = undefined, prev = undefined) {
        if (type === "update")
            return;
        this.emit('change', {
            type,
            value: key
        });
    }

    readonly size: number;

    clear(): void {
        this.yMap.clear();
        this.emit('change', null);
    }

    delete(value: string): boolean {
        const has = this.has(value);
        if (has){
            this.yMap.delete(value);
            this.emitChange('delete', value);
        }
        return has;
    }

    entries(): IterableIterator<[string, string]> {
        return this.yMap.entries()
    }

    has(value: string): boolean {
        return this.yMap.has(value);
    }

    keys(): IterableIterator<string> {
        return this.yMap.keys()
    }

    values(): IterableIterator<string> {
        return this.yMap.keys()
    }
}

