import {TreeItem} from "../../presentors/tree.presentor";
import {ContextProxy, IContextProxy} from "@proxy";
import { ObservableList } from "@cmmn/cell";

export interface TreeState {
    Items: ObservableList<TreeItem>;
    Selected: TreeItem;
    Root: IContextProxy;
    ItemsMap: Map<string, TreeItem>;
}