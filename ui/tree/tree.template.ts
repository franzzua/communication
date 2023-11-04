import {isMobile} from "is-mobile";
import {ITemplate} from "@cmmn/ui";
import {Fn} from "@cmmn/core";
import {Reducer} from "../reducers";
import {TreeItem} from "../../presentors/tree.presentor";
import {TreeState} from "./types";

const mobile = isMobile({tablet: true})

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <div class="items">
    ${state?.Items.map((item, index) => html(`item.${item.Path.join('.')}`)`
    <div item style=${{'--level': item.Path.length - 1}} class=${`level-${item.Path.length} ${item.Path.length > 3 ? 'li' : ''}`}>
        <ctx-text-content 
                message=${item.Message}
                .item=${{item, index}}
                onchange=${events.updateMessage(e => ({item: e.target.item.item, content: e.detail}))}
                onfocus=${events.setFocus(e => e.target.item)} 
                active=${Fn.compare(item.Path, state.Selected?.Path ?? [])} />
    </div>
    `)}
    </div>
    <span>${state?.Selected?.Path?.join(' / ')}</span>
`;
export type IState = {
    Items: TreeItem[];
    Selected: TreeItem;
}
export type IEvents = {
    setFocus(options: {item: TreeItem, index: number});
    updateMessage(options: {item: TreeItem, content: string});
    addMessage(text: string);
    reduce(reducer: Reducer<TreeState>);
}

