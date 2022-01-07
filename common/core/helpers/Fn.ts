import * as crc32 from "crc-32";
import {ulid} from "ulid";
import {cellx} from "cellx";

export const Fn = {
    I<T>(x: T): T {
        return x || null;
    },
    Ib<T>(x: T): boolean {
        return !!x;
    },
    Xor: <(x: any) => any>((x = null) => !x),
    Noop: () => undefined,
    False: () => false,
    True: () => true,
    Of<T>(x: T): () => T {
        return () => x;
    },
    Equal: x => y => x == y,
    NotEqual: x => y => x != y,
    Or: (x, y) => x || y,
    Class: x => function () {
        Object.assign(this, x);
    },
    Prop: prop => x => x[prop],
    Mult: k => x => x * k,
    Neg: x => -x,
    Cast<T>() {
        return <(x: any) => T>Fn.I;
    },
    ulid: ulid,
    combine: (...functions) => {
        return (...args) => {
            return functions.map(f => f(...args)).pop();
        }
    },
    pipe: (...functions) => {
        return functions.reduce((f1, f2) => (...args) => f2(f1(...args)))
    },
    arrayEqual: (arr1, arr2) => {
        if (arr1.length != arr2.length) return false;
        return arr1.every((a, i) => a == arr2[i]);
    },
    cache() {
        return (target, key, descr) => {
            const existed = descr.value;
            const cacheSymbol = Symbol("cache");
            descr.value = function (id) {
                if (!this[cacheSymbol]) this[cacheSymbol] = {};
                return this[cacheSymbol][id] ||
                    (this[cacheSymbol][id] = existed.call(this, id))
            };
            return descr;
        }
    },
    crc32(value) {
        return crc32.str(JSON.stringify(value));
    },

    distinctUntilChanged<T>(comparator: (x: T, y: T) => boolean) {
        return (target, key, descr) => {
            const symbol = Symbol(key + 'distinct');
            return {
                get() {
                    const cell = this[symbol] ?? (this[symbol] = cellx(() => descr.get.call(this), {
                        compareValues: comparator
                    }));
                    return cell();
                }
            }
        }
    }
};
