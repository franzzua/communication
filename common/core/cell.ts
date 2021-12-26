import {Cell,  IEvent} from "cellx";

export const cell = {
    fromEvent<
        TEvent extends Event,
        TTarget extends EventTarget = EventTarget,
    >(target: TTarget, eventname: string, options?: EventListenerOptions): Cell<TEvent> {
        return new EventCell<TEvent>(target, eventname, options);
    }
}

export abstract class HotCell<T> extends Cell<T> {
    protected constructor() {
        super(undefined);
    }

    protected abstract Subscribe();

    protected abstract Unsubscribe();

    subscribe(listener: (err: (Error | null), evt: IEvent) => any, context?: any): this {
        if (this._hasSubscribers) {
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

export class EventCell<TEvent> extends HotCell<TEvent> {
    private static Listener = function (event: Event) {
        this.set(event);
    }
    private listener = EventCell.Listener.bind(this);

    constructor(private target: EventTarget, private eventName: string, private options?: EventListenerOptions) {
        super();
    }

    protected Subscribe() {
        this.target.addEventListener(this.eventName, this.listener, this.options);
    }

    protected Unsubscribe() {
        this.target.removeEventListener(this.eventName, this.listener, this.options);
    }

}
