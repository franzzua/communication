import {
    distinctUntilChanged,
    filter,
    Injectable,
    map,
    first,
    mapTo,
    merge,
    Observable,
    of,
    tap,
    withLatestFrom,
} from "@hypertype/core";
import {Component, HyperComponent, IEventHandler, property} from "@hypertype/ui";
import {Message} from "@model";
import {EventBus, MessageService} from "@services";

@Injectable(true)
@Component({
    name: 'ctx-text-content',
    template: (html, state, events: IEventHandler<IEvents>) => html`
        <div contenteditable class="editor"
             oninput=${events.input(x => x.target.innerText)}
             onfocus=${events.focus(x => void 0)}>
        </div>
    `,
    style: `ctx-text-content { cursor: text; flex: 1; }`
})
export class TextContentComponent extends HyperComponent<string, IEvents> {

    constructor(private eventBus: EventBus) {
        super();
    }

    @property()
    private message$!: Observable<Message>;
    private message!: Message;


    @property()
    private active$!: Observable<boolean>;
    private active!: boolean;

    private lastTextEdited;

    public Events: IEvents = {
        input: async text => {
            this.lastTextEdited = text;

            await this.eventBus.Notify('OnUpdateContent', this.message, text);
        },
        focus: async () => {
            const element: HTMLElement = await this.Element$.pipe(first()).toPromise();
            if(!this.active)
                element.dispatchEvent(new FocusEvent('focus'));
            // this.cursor.SetPath(this.path);
        }
    }

    public State$ = of(null);

    public Actions$ = merge(
        this.message$.pipe(
            // switchMap(c => c.State$),
            map(message => message?.Content),
            // tap(console.log),
            // игнорим если отсюда пришел контент
            filter(x => x != this.lastTextEdited),
            distinctUntilChanged(),
            withLatestFrom(this.select<HTMLElement>('[contenteditable]')),
            tap(([text, element]) => {
                element.innerHTML = text;
            })
        ),
        this.active$.pipe(
            distinctUntilChanged(),
            filter(x => x == true),
            withLatestFrom(this.select<HTMLElement>('[contenteditable]')),
            tap(([_, element]) => {
                element.focus()
            })
        )
    ).pipe(mapTo(null))
}

export interface IEvents {
    input(text);

    focus();
}