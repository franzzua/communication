import {ActionsCreator, ObservableStore, Reducer, RootStore} from "@hypertype/app";
import {Communication, Context} from "@model";
import {filter, Fn, Injectable, map, Observable, shareReplay} from "@hypertype/core";
import {DomainEvent, DomainEventHandler, EventBus} from "@services";

@Injectable()
export class ContextStore extends ObservableStore<State> {

    constructor(private rootStore: RootStore, private eventBus: EventBus) {
        super(rootStore, 'data');
        this.eventBus.EventStream$.subscribe(action => {
            this.Actions.Action(action);
        })
    }


    public Actions = new ContextActions();

    public reducer = new ContextReducer();


    public State$ = this.asObservable().pipe(
        filter(Fn.Ib),
        shareReplay(1)
    );

    public getContext$(uri: string): Observable<Context> {
        return this.State$.pipe(
            map(x => x.Contexts.get(uri))
        );
    }

}

export class ContextActions extends ActionsCreator<Context> {

}

export class ContextReducer {
    private state: State = {
        Contexts: new Map<string, Context>(),
        Communications: new Map<string, Communication>()
    };

    private Handler: DomainEventHandler = {
        UpdateContent: async event => {
            const context = this.state.Contexts.get(event.Message.Context.URI);
            this.state.Contexts.set(context.URI, {
                ...context,
                Messages: [
                    ...context.Messages.filter(x => x != event.Message),
                    {
                        ...event.Message,
                        Content: event.Content
                    }
                ]
            });
        },
        AddMessage: async event => {
            const context = this.state.Contexts.get(event.Message.Context.URI);
            this.state.Contexts.set(context.URI, {
                ...context,
                Messages: [
                    ...context.Messages.filter(x => x != event.Message),
                    event.Message
                ]
            });
        },
        CreateContext: async event => {
            this.state.Contexts.set(event.Context.URI, event.Context);
        }
    }

    public reduce: Reducer<State> = (state: State, action: DomainEvent) => {
        const reducer = this.Handler[action.type];
        reducer && reducer(action.payload);
        return this.state
    }
}

export type State = {
    Contexts: Map<string, Context>;
    Communications: Map<string, Communication>;
}