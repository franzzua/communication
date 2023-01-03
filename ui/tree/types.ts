import {TreeItem} from "../../presentors/tree.presentor";
import {ContextProxy} from "@proxy";
import { ObservableList } from "@cmmn/cell";

export interface TreeState {
    Items: ObservableList<TreeItem>;
    Selected: TreeItem;
    Root: ContextProxy;
    ItemsMap: Map<string, TreeItem>;
}