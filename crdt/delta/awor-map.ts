import {Kernel} from "../common/kernel";
import {AworSet} from "./awor-set";
import {Mergeable, merge,ConstructorOf, IDeltaMergeable, Split, Constructor} from "../common/mergeable";
import {Replica} from "../common/common";

type AwoMapDelta<TKey, TValue> = {
    kernel: Kernel<TKey>;
    map: ReadonlyMap<TKey, TValue>;
};

export class AworMap<TKey, TValue extends Mergeable> extends IDeltaMergeable<AwoMapDelta<TKey, TValue>> {
    protected new = this.constructor as ConstructorOf<this, typeof AworMap>;

    public static Zero<TKey, TValue extends Mergeable>(){
        return new AworMap(AworSet.Zero<TKey>(), new Map<TKey, TValue>());
    }


    public constructor(
        protected readonly set: AworSet<TKey>,
        protected readonly map: ReadonlyMap<TKey, TValue>
    ) {
        super();
    }

    public with(replica: Replica, key: TKey, value: TValue): this {
        return new this.new(
            1,
            this.set.with(replica, key),
            this.map.with([key, value])
        )
    }

    public without(key: TKey): this {
        return new this.new(
            this.set.without(key),
            this.map.without(key)
        );
    }

    public merge(x: this): this {
        const keys = this.set.merge(x.set);
        const map = new Map<TKey, TValue>([...keys.values].map(key =>
            [key, merge(this.map.get(key), x.map.get(key)) as TValue]
        ));
        return new this.new(keys, map);
    }

    public mergeDelta(delta: AwoMapDelta<TKey, TValue>): this {
        const keys = this.set.mergeDelta(delta.kernel);
        const map = new Map<TKey, TValue>([...keys.values].map(key =>
            [key, merge(this.map.get(key), delta.map.get(key)) as TValue]
        ));
        return new this.new(keys, map);
    }

    public get values(): [TKey, TValue][]{
        return [...this.map.entries()];
    }

    public get delta(){
        return {
            kernel: this.set.delta,
            map: new Map<TKey, TValue>([...this.set.delta.values].map(key => [key, this.map.get(key)]))
        };
    }

    public toString(){
        return this.set.toString() +"\n" +
            [...this.map.entries()].map(([key,value]) => `${key}:${value}`).join(', ');
    }

    public split(): Split<this, AwoMapDelta<TKey, TValue>> {
        const {value, delta} = this.set.split();
        return {
            value: new this.new(value, new Map<TKey, TValue>([...value.values].map(key => [key, this.map.get(key)]))),
            delta: {
                kernel: delta,
                map: new Map<TKey, TValue>([...delta.values].map(key => [key, this.map.get(key)]))
            }
        }
    }
}
