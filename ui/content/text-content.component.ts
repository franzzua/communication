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
import {award} from "rdf-namespaces/dist/schema";

@Injectable(true)
@Component({
    name: 'ctx-text-content',
    template: (html, state, events: IEventHandler<IEvents>) => html`
        <div contenteditable class="editor"
             oninput=${events.input(x => x.target.innerText)}
             onfocus=${events.focus(x => void 0)}>
        </div>
    `,
    style: require('./text-content.style.less')
})
export class TextContentComponent extends HyperComponent<string, IEvents> {

    @property()
    private content$!: Observable<string>;
    private content!: string;

    @property()
    private active$!: Observable<boolean>;
    private active!: boolean;

    private lastTextEdited;

    public Events: IEvents = {
        input: async text => {
            this.lastTextEdited = text;
            const element =  await this.Element$.pipe(first()).toPromise();
            element.dispatchEvent(new CustomEvent('change', {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: text
            }));
            // await this.eventBus.Notify('OnUpdateContent', this.message, text);
        },
        focus: async () => {
            const element: HTMLElement = await this.Element$.pipe(first()).toPromise();
            if(!this.active)
                element.dispatchEvent(new FocusEvent('focus'));
            // this.cursor.SetPath(this.path);
        }
    }

    private contentEditable$: Observable<HTMLDivElement> = this.select('[contenteditable]');

    public State$ = of(null);

    public Actions$ = merge(
        this.content$.pipe(
            // switchMap(c => c.State$),
            // игнорим если отсюда пришел контент
            filter(x => x != this.lastTextEdited),
            distinctUntilChanged(),
            withLatestFrom(this.contentEditable$),
            tap(([text, element]) => {
                element.textContent = text;
            })
        ),
        this.active$.pipe(
            distinctUntilChanged(),
            withLatestFrom(this.contentEditable$),
            tap(async ([isActive, div]) => {
                const textNode = div.firstChild as Text;
                if (!isActive) {
                    div.classList.remove('focus');
                    return;
                }
                div.focus();
                div.classList.add('focus');
                await new Promise(x => setTimeout(x, 0));
                const selection = window.getSelection();
                if (selection.containsNode(textNode))
                    return;
                const range = document.createRange();
                range.setStart(textNode,textNode.textContent.length);
                range.setEnd(textNode,textNode.textContent.length);
                selection.removeAllRanges();
                selection.addRange(range);
            })
        )
    ).pipe(mapTo(null))
}

export interface IEvents {
    input(text);

    focus();
}
