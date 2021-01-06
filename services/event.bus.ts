import * as h from "@hypertype/core";
import {delayAsync, Injectable, Observable, Subject, utc} from "@hypertype/core";
import {Context, Message, Storage} from "@model";
import {IAccountInfo} from "./account.manager";

@Injectable()
export class EventBus {

    private _eventSubject = new Subject<DomainEvent>();
    public EventStream$: Observable<DomainEvent> = this._eventSubject.asObservable().pipe(
        h.shareReplay(1)
    );

    public Notificator = this.getNotificator();

    public getNotificator(listener?: DomainEventsListener): DomainEventsListener{
        return new Proxy({},{
            get: (target: {}, p: PropertyKey, receiver: any) => {
                return (...args) => {
                    this._eventSubject.next({
                        type: p as any,
                        payload: args,
                        source: listener
                    })
                }
            }
        }) as any;
    }

    public Notify: Notify2Delegate = (type, ...args) => {
        this._eventSubject.next({
            type,
            payload: args
        });
    }


    public Subscribe(listener: DomainEventsListener) {
        return this.EventStream$.pipe(
            // h.tap(x => console.log(x, listener)),
            h.filter(x => x.source != listener),
            h.filter(x => x.type in listener),
            h.mergeMap(x => (listener[x.type] as any)(...x.payload) ?? Promise.resolve()),
        );
    }

}

export type NotifyDelegate = <TKey extends keyof DomainEvents>(type: TKey, data: DomainEvents[TKey] & {
    source?: any
}) => void;


export type Notify2Delegate = <TKey extends keyof DomainEventsListener>(type: TKey, ...args: Parameters<DomainEventsListener[TKey]>) => void;

export type DomainEvent = {
    type: keyof DomainEventsListener,
    payload: any[],
    source?: any
}

export interface DomainEventsListener {
    OnLoadContext?(uri: string);

    OnCreateContext?(context: Context);

    OnAttachContext?(context: Context, to: Message);

    OnUpdateContent?(message: Message, content: any);

    OnAddMessage?(message: Message);

    OnDeleteMessage?(message: Message);

    OnContextChanged?(uri: string): void;

    OnNewAccount?(info: IAccountInfo): void;

    OnNewStorage?(storage: Storage): void;
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
    },
    ContextChangedMessage: {
        ContextURI: string;
    }
};

export type DomainEventHandler = {
    [key in keyof DomainEvents]?: (event: DomainEvents[key]) => Promise<void>;
}
