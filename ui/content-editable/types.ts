import {TreeItem} from "../../presentors/tree.presentor";
import {ItemSelection} from "./itemSelection";
import {ItemsCollection} from "./items-collection";

export type ContentEditableState = {
    Items: ItemsCollection;
    Selection: ItemSelection<TreeItem>;
}