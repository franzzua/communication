import { ITemplate } from "@cmmn/ui";
import {EditorItem} from "./types";

export const template: ITemplate<IState, IEvents> = (html,state, events) => {
    return html`
        <div controls>
            ${state.Items.map(x => html(x.Path.join(':'))`
                <editor-controls item=${x}
                                 style=${{'--level': x.Path.length}}
                                 class=${`item control level-${x.Path.length}`} level=${x.Path.length}/>
            `)}
        </div>
        <div contenteditable autofocus tabindex="0" spellcheck="false"></div>
    `;
};

export type IState = {
    Items: EditorItem[];
}
export type IEvents = {

}