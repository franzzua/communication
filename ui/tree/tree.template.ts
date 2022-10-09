import { TreeItem } from "../../presentors/tree.presentor";
import type { Reducer } from "./tree.component";
import { isMobile } from "is-mobile";
import { ITemplate } from "@cmmn/ui";
import { ContextProxy } from "@services";
import { ObservableList } from "@cmmn/cell";
import {ItemSelection} from "./itemSelection";

const mobile = isMobile({ tablet: true })

export const TreeTemplate: ITemplate<Pick<IState, "Items">, IEvents> = (html, state, events) => html`
    <content-editable items=${state.Items}
                      onaction=${events.InvokeAction(x => x.detail)}/>
    <ctx-mobile-toolbar state=${state}
                        onreduce=${events.InvokeAction(x => x.detail)}/>

`;

export interface IState {
    Items: ObservableList<TreeItem>;
    Selection: ItemSelection<TreeItem>;
    Root: ContextProxy;
    ItemsMap: Map<string, TreeItem>;
}

export type IEvents = {
    // setFocus({ item: Item, index: number });
    // updateMessage({ item: Item, content: string });
    // addMessage(text: string);
    InvokeAction(reducer: Reducer<IState>);
}

