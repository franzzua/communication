import * as h from "@hypertype/core";
import {delayAsync, Injectable, Observable, Subject, utc} from "@hypertype/core";
import {Context, Message, Sorting} from "@model";

@Injectable()
export class EventBus {

    constructor() {
        // @ts-ignore
        window.EventBus = this;
    }

    private _eventSubject = new Subject<DomainEvent>();
    public EventStream$: Observable<DomainEvent> = this._eventSubject.asObservable().pipe(
        h.shareReplay({
            bufferSize: 1,
            windowTime: 1000,
            refCount: true,
        })
    );

    public Notify: NotifyDelegate = <TKey extends keyof DomainEvents, TData extends  DomainEvents[TKey]>(type: TKey, data: TData) => {
        this._eventSubject.next({
            type,
            payload: data
        });
    }

    public Subscribe(handler: DomainEventHandler, source: any = null) {
        return this.EventStream$.pipe(
            h.filter(x => x.payload.source != source),
            h.filter(x => x.type in handler),
            h.mergeMap(x => handler[x.type](x.payload) ?? Promise.resolve()),
        );
    }

    public async Init() {
        await delayAsync(100);
        const context = {
            URI: 'root',
            Messages: [],
        };
        this.Notify('CreateContext', {
            Context: context
        });
        this.Notify('AddMessage', {
            Message: {
                Content: '1',
                CreatedAt: utc(),
                Context: context,
                Author: null
            }
        });
        this.Notify('AddMessage', {
            Message: {
                Content: '2',
                CreatedAt: utc(),
                Context: context,
                Author: null
            },
        });
    }
}

export type NotifyDelegate = <TKey  extends keyof DomainEvents>(type: TKey, data: DomainEvents[TKey]) => void;

export type DomainEvent = {
    type: keyof DomainEvents,
    payload: any
}

export type DomainEvents = {
    LoadContext: {
        URI: string;
    },
    CreateContext: {
        Context: Context;
    },
    AttachContext: {
        Context: Context;
        Message: Message;
    },
    UpdateContent: {
        Message: Message;
        Content: any;
    },
    AddMessage: {
        Message: Message;
    }
};

export type DomainEventHandler = {
    [key in keyof DomainEvents]?: (event: DomainEvents[key]) => Promise<void>;
}
