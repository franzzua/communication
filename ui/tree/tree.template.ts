import { Fn } from "@hypertype/core";
import {IEventHandler, wire} from "@hypertype/ui";
import {Context, Message} from "@model";
import {TreeItem} from "../../presentors/tree.presentor";
import type {Reducer} from "./tree.component";
import {isMobile} from "is-mobile";

const mobile = isMobile({tablet: true})

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    <div class="items">
    ${state?.Items.map((item,index)  => html(`item.${item.Path.join('.')}`)`
    <div item style=${{'--level': item.Path.length - 1}} class=${`level-${item.Path.length} ${item.Path.length > 3 ? 'li' : ''}` }>
        <ctx-text-content 
                content=${item.Message.Content}
                data=${{item,index}}
                onchange=${events.updateMessage(e => ({item: e.target.data.item, content: e.detail}))}
                onfocus=${events.focus(e => e.target.data)} 
                active=${Fn.arrayEqual(item.Path, state.Selected?.Path ?? [])} />
    </div>
    `)}
    </div>
    <span style="display: none;">${state?.Selected?.Path?.join(' / ')}</span>
    ${mobile ? html('toolbar')`<ctx-mobile-toolbar state=${state} onreduce=${events.reduce(x => x.detail)}></ctx-mobile-toolbar>` : ''}
 
`;

export interface IState {
    Items: TreeItem[];
    Selected: TreeItem;
    Root: Context;
    ItemsMap: Map<string, TreeItem>;
}

export interface IEvents {
    focus({item: Item, index: number});
    updateMessage(message: Message);
    addMessage(text: string);
    reduce(reducer: Reducer<IState>);
}

