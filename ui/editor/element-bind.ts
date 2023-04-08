import { Cell } from "@cmmn/cell";
import { DateTime, Disposable } from "@cmmn/core";
import {EditorItem} from "./types";

export class ElementBind extends Disposable {
    constructor(public readonly id: string,
                public element: Element,
                public item: EditorItem) {
        super();
        // console.log('bind', id, element );
    }
    protected bind(){
        this.onDispose = Cell.OnChange(() => this.item.State.Content, e => {
            this.element.textContent = e.value;
        });
    }

    public hasChanges(item: EditorItem) {
        return !this.item.State?.UpdatedAt.equals(item.State.UpdatedAt) ||
            this.item.Index !== item.Index ||
            this.id !== item.Path.join(':') ||
            this.element.textContent !== item.State.Content;
    }

    update(item: EditorItem, element: Element) {
        this.item = item;
        this.element = element;
        this.dispose();
        this.bind();
    }
}