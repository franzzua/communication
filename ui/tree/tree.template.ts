import {TreeItem} from "../../presentors/tree.presentor";
import type {Reducer} from "./tree.component";
import {isMobile} from "is-mobile";
import {ITemplate} from "@cmmn/ui";
import {ContextProxy} from "@services";
import {Fn} from "@cmmn/core";
import {} from "less";

const mobile = isMobile({tablet: true})

export const template: ITemplate<Pick<IState, "Items" | "Selected">, IEvents> = (html, state, events) => html`
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
    <span style="display: none;">${state?.Selected?.Path?.join(' / ')}</span>
    <ctx-mobile-toolbar state=${state} onreduce=${events.reduce(x => x.detail)}></ctx-mobile-toolbar>

`;

export interface IState {
    Items: TreeItem[];
    Selected: TreeItem;
    Root: ContextProxy;
    ItemsMap: Map<string, TreeItem>;
}

export type IEvents = {
    setFocus(data: {item: TreeItem, index: number});
    updateMessage(data: {item: TreeItem, content: string});
    addMessage(text: string);
    reduce(reducer: Reducer<IState>);
}

