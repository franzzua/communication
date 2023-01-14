import {EditorSelection} from "./editor-selection";
import {EditorCollection} from "./editor-collection";
import {IMessageProxy} from "@proxy";
import { Message } from "@model";

export type ContentEditableState = {
    Items: EditorCollection;
    Selection: EditorSelection;
}

export type EditorItem = {
    Index?: number;
    State?: Message;
    Parent?: EditorItem;
    Path: string[];
    Message: IMessageProxy;
    IsOpened: boolean;
    Length: number;
}