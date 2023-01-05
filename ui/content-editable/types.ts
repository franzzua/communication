import {TreeItem} from "../../presentors/tree.presentor";
import {ItemSelection} from "./itemSelection";
import {ItemsCollection} from "./items-collection";
import {ElementInfo} from "./element-cache";

export type ContentEditableState = {
    Items: ItemsCollection;
    Selection: ItemSelection<ElementInfo<TreeItem, Node>>;
}