import {Fn, utc} from "@cmmn/core";
import {MessageProxy} from "@proxy";
import {TreeItem} from "../../presentors/tree.presentor";
import {ContentEditableComponent, ItemElement} from "./content-editable.component";
import {ElementCache} from "./element-cache";
import {it} from "@jest/globals";

export class DiffApply {
    constructor(private component: ContentEditableComponent) {

    }


    apply(diff: { ui: Diff<TreeItem, Node>, model: Diff<TreeItem, Node> }) {
        if (diff.ui.isEmpty() && diff.model.isEmpty()) {
            return;
        }
        for (let {item, child} of diff.ui.updated) {
            item.Message.UpdateContent(child.textContent);
        }
        if (diff.ui.added.length) {
            if (this.component.Selection) {
                const selected = this.component.Selection?.Focus.item;
                // selected element children belongs to last element
                const lastAdded = diff.ui.added[diff.ui.added.length - 1];
                if (lastAdded.child.nextSibling !== selected.element) {
                    diff.ui.added.pop();
                    selected.item.Message.UpdateContent(lastAdded.child.textContent);
                    this.setChildItem(lastAdded.child, selected.item);
                    diff.ui.added.unshift({child: selected.element, item: null});
                }
                for (let {child} of diff.ui.added) {
                    this.addMessageBefore(selected.item, child);
                }
            } else {
                const lastNextChild = diff.ui.added[diff.ui.added.length - 1].child.nextSibling;
                const item = this.component.elementCache.get(lastNextChild)?.item;
                for (let {child} of diff.ui.added) {
                    this.addMessageBefore(item, child);
                }
            }
        }
        for (let {item, child} of diff.ui.deleted) {
            item.Message.Actions.Remove();
        }

        for (let {item} of diff.model.added) {
            this.insert(item);
        }
        for (let {child, item} of diff.model.deleted) {
            this.component.element.removeChild(child);
            this.component.elementCache.remove(child);
        }
        for (let {child, item} of diff.model.updated) {
            this.setChildItem(child, item);
        }

    }

    private addMessageBefore(item: TreeItem, child: Node) {
        const context = item?.Message.Context ?? this.component.ContextProxy;
        const index = item ? context.Messages.indexOf(item?.Message) : context.Messages.length;
        const newMessage = context.CreateMessage({
            Content: child.textContent,
            id: Fn.ulid(),
            CreatedAt: utc(),
            UpdatedAt: utc(),
            ContextURI: context.State.URI,
        }, index);
        const newItem = {
            Message: newMessage,
            IsOpened: false,
            Path: (item?.Path.slice(0, -1) ?? []).concat([newMessage.State.id]),
            Length: 0
        };
        this.setChildItem(child, newItem);
        return newItem;
    }

    private setChildItem(child: Node, item: TreeItem) {
        if (child.textContent != item.Message.State.Content)
            child.textContent = item.Message.State.Content;
        const info = this.component.elementCache.get(child)
        if (info && info.item.Index !== item.Index) {
            this.component.element.insertBefore(child, this.component.childNodes[item.Index]);
        }
        if (child instanceof HTMLSpanElement || child instanceof HTMLElement && child.localName === 'span') {
            const id = item.Path.join(':');
            child.id = id;
            child.className = `item level-${item.Path.length}`
            child.style.setProperty('--level', item.Path.length.toString());
            this.component.elementCache.set(id, item, child);
            // this.cache.set(item.Message, child);
        }
    }

    private insert(item: TreeItem) {
        const newNode = document.createElement('span') as ItemElement;
        this.setChildItem(newNode, item);
        newNode.index = item.Index;
        const child = this.component.element.childNodes[item.Index];
        if (child) {
            this.component.element.insertBefore(newNode, child);
        } else {
            this.component.element.appendChild(newNode);
        }
        return newNode;
    }
}

export class Diff<TItem = TreeItem, TElement = ItemElement> {
    deleted: { child?: TElement; item?: TItem }[] = [];
    added: { child?: TElement; item?: TItem }[] = [];
    updated: { child?: TElement; item?: TItem }[] = [];

    isEmpty() {
        return this.deleted.length == 0 && this.added.length == 0 && this.updated.length == 0;
    }

    equals(diff: Diff<TItem,TElement>) {
        return diff === this;
    }
}
