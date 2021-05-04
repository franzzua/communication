import "./extend";

export type Constructor<T, TArgs extends Array<any>> = new (...TArgs) => T;

export declare type ConstructorOf<TResult, TTarget extends {
    new (...args): any
}> = Constructor<TResult, ConstructorParameters<TTarget>>;

export type Mergeable = IMergeable | number | ReadonlySet<any>;

export abstract class IMergeable {
    abstract merge(x: this): this;
}


export type Split<T, TDelta> = {
    value: T;
    delta: TDelta;
}

export abstract class IDeltaMergeable<T> extends IMergeable{
    abstract get delta(): T;
    abstract mergeDelta(delta: T): this;
    abstract split(): Split<this, T>;
}

export function merge<T extends Mergeable>(a: T, b: T): T{
    if (!a) return b;
    if (!b) return a;
    if (typeof a === "number") {
        if (typeof b !== "number")
            throw new Error(`unable merge ${a} with ${b}`);
        return Math.max(a, b) as T;
    }
    if (a instanceof Set) {
        if (b instanceof Set)
            return new Set([...a, ...b]) as ReadonlySet<any> as T;
        throw new Error(`unable merge ${a} with ${b}`);
    }
    if (a instanceof IMergeable && b instanceof IMergeable) {
        if (a.constructor !== b.constructor){
            throw new Error(`unable merge ${a} with ${b}, should be same types`);
        }
        return a.merge(b) as T;
    }
}
