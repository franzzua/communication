interface Map<K, V> {
    getOrAdd(key: K, factory: (key: K) => V): V;
}

Map.prototype.getOrAdd = function (key, factory) {
    const existed = this.get(key);
    if (existed) return existed;
    const newItem = factory(key);
    this.set(key, newItem);
    return newItem;
}