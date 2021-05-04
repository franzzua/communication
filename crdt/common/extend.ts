
declare interface Array<T> {
    orderBy(selector: (t: T) => (string | number), descending?: any): Array<T>;
}

Array.prototype.orderBy = function (selector = x => x) {
    return [...this].sort((a, b) => (selector(a) > selector(b)) ? 1 : -1);
};

declare interface ReadonlyMap<K, V> {
    with(...pairs: [K, V][]): ReadonlyMap<K, V>;

    without(...keys: K[]): ReadonlyMap<K, V>;

    withoutValue(value: V): ReadonlyMap<K, V>;
}
declare interface Map<K, V> extends ReadonlyMap<K, V> {

}

Map.prototype.with = function (...pairs) {
    return new Map([...this, ...pairs]);
}

Map.prototype.without = function (...keys) {
    return keys.reduce(
        (map, x) => map.delete(x) && map,
        new Map([...this.entries()])
    );
}


declare interface ReadonlySet<T> {
    with(...keys: T[]): ReadonlySet<T>;

    without(...keys: T[]): ReadonlySet<T>;
}

declare interface Set<T> extends ReadonlySet<T> {

}

Set.prototype.with = function (...items) {
    return new Set([...this, ...items]);
}


Set.prototype.without = function (...items) {
    return new Set([...this].filter(x => !items.includes(x)));
}
