import {component, HtmlComponent, property} from "@cmmn/ui";
import {Injectable, bind} from "@cmmn/core";
import {MessageProxy} from "@services";

@Injectable(true)
@component<string, IEvents>({
    name: 'ctx-text-content',
    template: (html, state, events) => html`
        <div contenteditable class="editor"
             oninput=${events.input(x => x.target.innerText)}
             onfocus=${events.focus(x => void 0)}>
        </div>
    `,
    style: require('./text-content.style.less')
})
export class TextContentComponent extends HtmlComponent<string, IEvents> {

    constructor() {
        super();
    }

    @property()
    private message!: MessageProxy;

    @property()
    private active!: boolean;

    private lastTextEdited;

    async input(text) {
        this.lastTextEdited = text;
        this.message.Actions.UpdateText(text);
        // this.dispatchEvent(new CustomEvent('change', {
        //     bubbles: true,
        //     cancelable: true,
        //     composed: true,
        //     detail: text
        // }));
        // await this.eventBus.Notify('OnUpdateContent', this.message, text);
    }

    async focus() {
        if (!this.active)
            this.dispatchEvent(new FocusEvent('focus'));
        // this.cursor.SetPath(this.path);
    }

    private get contentElement(): HTMLElement {
        return this.querySelector('[contenteditable]');
    }

    public get State() {
        return null;
    }

    @bind
    private setContent() {
        const div = this.contentElement;
        div.textContent = this.message?.State?.Content;
    }

    @bind
    private async setSelection(rt) {
        const div = this.contentElement;
        if (!this.active) {
            div.classList.remove('focus');
            return;
        }
        div.focus();
        div.classList.add('focus');
        await new Promise(x => setTimeout(x, 0));
        const selection = window.getSelection();
        const textNode = div.firstChild as Text;
        if (!textNode)
            return;
        if (selection.containsNode(textNode))
            return;
        const range = document.createRange();
        range.setStart(textNode, textNode.textContent.length);
        range.setEnd(textNode, textNode.textContent.length);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    public Effects = [
        this.setContent,
        this.setSelection
    ]

}

export type IEvents = {
    input(text);
    focus();
}
