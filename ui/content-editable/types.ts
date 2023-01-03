import {TreeItem} from "../../presentors/tree.presentor";
import {ItemSelection} from "./itemSelection";
import {ContextProxy} from "@proxy";
import { ObservableList } from "@cmmn/cell";

export type ContentEditableState = {
    Items: ObservableList<TreeItem>;
    Selection: ItemSelection<TreeItem>;
    Root: ContextProxy;
    ItemsMap: Map<string, TreeItem>;
}