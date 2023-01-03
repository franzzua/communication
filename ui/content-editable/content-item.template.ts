import { ITemplate } from "@cmmn/ui";
import { TreeItem } from "../../presentors/tree.presentor";
import { ObservableList } from "@cmmn/cell";

export const ContentItemTemplate: ITemplate<IState, any> = (html, state, events) => html`
    ${state.item.Message.State?.Content ?? ' '}
`;

export type IState = {
    item: TreeItem;
    index: number;
}