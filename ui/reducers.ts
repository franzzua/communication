import { Cell } from "@cmmn/cell";
import { AsyncQueue } from "@cmmn/core";

// export type TransformResult<T> = T | Promise<T>;
export type Reducer<T> = (t: T) => T;

export class ReducerQueueState<TState> extends Cell<TState> {
    private asyncQueue = new AsyncQueue()

    public Invoke(reducer: Promise<Reducer<TState>> | Reducer<TState>) {
        if (reducer instanceof Promise) {
            this.asyncQueue.Invoke(() => reducer.then(reducer => this.set(reducer(this.get()))));
        } else {
            this.set(reducer(this.get()));
        }
    }
}