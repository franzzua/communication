import {Cell, IEvent} from "cellx";

export abstract class HotCell<T> extends Cell<T> {
    protected constructor() {
        super(undefined);
    }

    protected abstract Subscribe();

    protected abstract Unsubscribe();

    subscribe(listener: (err: (Error | null), evt: IEvent) => any, context?: any): this {
        if (!this._hasSubscribers) {
            this.Subscribe();
        }
        const res = super.subscribe(listener, context);
        return res;
    }

    unsubscribe(listener: (err: (Error | null), evt: IEvent) => any, context?: any): this {
        const res = super.unsubscribe(listener, context);
        if (!this._hasSubscribers) {
            this.Unsubscribe();
        }
        return res;
    }

    dispose(): this {
        this.Unsubscribe();
        return super.dispose();
    }
}