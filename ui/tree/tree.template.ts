import { Fn } from "@hypertype/core";
import {IEventHandler, wire} from "@hypertype/ui";
import {Context, Message} from "@model";
import {TreeItem} from "../../presentors/tree.presentor";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${state?.Items.map((item,index)  => html(`item.${item.Path.join('.')}`)`
    <div item style=${{'--level': item.Path.length - 1}}>
        <div>
        ${item.Message.SubContext ? (item.IsOpened ? '-' : '+') : '*'}
        </div>
        <ctx-text-content 
                message=${item.Message}
                data=${{item,index}}
                onfocus=${events.focus(e => e.target.data)} 
                active=${item == state.Selected || Fn.arrayEqual(item.Path, state.Selected?.Path ?? [])} />
    </div>
    `)}
    <label>
        <span>Selected</span>
        <ul>
            ${state?.Selected?.Path?.map(p => wire()`
                <li>${p?.split('#')?.pop() ?? 'id null'}</li>
            `)}        
        </ul>
    </label>
`;

export interface IState {
    Items: TreeItem[];
    Selected: TreeItem;
    Root: Context;
    ItemsMap: Map<string, TreeItem>;
}

export interface IEvents {
    focus({item: Item, index: number});
}

