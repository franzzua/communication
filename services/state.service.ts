import {DomainEventsListener, EventBus} from "./event.bus";
import {BehaviorSubject, delayAsync, Injectable, map, Observable, shareReplay, tap, utc} from "@hypertype/core";
import {Context, Message} from "@model";
import {LogService} from "./log.service";

@Injectable()
export class StateService implements DomainEventsListener{

    constructor(private eventBus: EventBus,
                private logService: LogService) {

        // @ts-ignore
        window.State = this;
    }

    public State = new Map<string, Context>();

    async Load(context: Context, notify = true) {
        this.State.set(context.URI, context);
        for (const m of context.Messages) {
            if (m.SubContext)
                await this.Load(context, false);
        }
        notify && this._subject$.next(this.State);
    }

    async OnCreateContext(context) {
        // if (context.URI && this.State.has(context.URI))/**/
        //     return;
        this.State.set(context.URI, {
            ...context
        });
        this._subject$.next(this.State);
        // this.eventBus.Notify('OnCreateContext', context);
    }

    async OnAddMessage(message: Message) {

        const context = this.State.get(message.Context.URI);
        const existed = context.Messages.find(Message.equals(message));
        if (existed) {
            const index = context.Messages.indexOf(existed);
            context.Messages[index] = message;
        } else {
            context.Messages.push(message);
        }
        this._subject$.next(this.State);
        // this.eventBus.Notify('OnAddMessage', message);
    }

    public OnDeleteMessage(message: Message) {
        const context = this.State.get(message.Context.URI);
        const existed = context.Messages.find(Message.equals(message));
        context.Messages.remove(existed);
        this._subject$.next(this.State);
        // this.eventBus.Notify('OnDeleteMessage', message);
    }

    async OnUpdateContent(message: Message, content: any) {
        const context = this.State.get(message.Context.URI);
        const existed = context.Messages.find(Message.equals(message));
        if (existed.Content == content)
            return;
        const index = context.Messages.indexOf(existed);
        context.Messages[index] = {
            ...existed,
            Content: content
        };
        this._subject$.next(this.State);
        // this.eventBus.Notify('OnUpdateContent', message, content);
    }


    // @ts-ignore
    private _subject$ = new BehaviorSubject<StateService["State"]>(this.State);
    public State$: Observable<StateService["State"]> = this._subject$.asObservable().pipe(
        tap(console.log),
        shareReplay(1)
    );


    public Actions$ = this.eventBus.Subscribe(this);

    public getContext$(uri: string): Observable<Context> {
        return this.State$.pipe(
            map(x => x.get(uri)),
        );
    }


    public async Init() {
        await delayAsync(100);
        const context = {
            URI: 'root',
            Messages: [],
        };
        await this.OnCreateContext(context)
        await this.OnAddMessage({
            Content: '1',
            CreatedAt: utc(),
            Context: context,
            Author: null
        });
        await this.OnAddMessage({
            Content: '2',
            CreatedAt: utc(),
            Context: context,
            Author: null
        });
    }

}