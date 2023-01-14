import {Fn, utc} from "@cmmn/core";
import {EditorComponent} from "./editor.component";
import {EditorItem} from "./types";

export class DiffApply {
    constructor(private component: EditorComponent) {

    }

    apply(diff: { ui: Diff, model: Diff }) {
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
                const lastNextChild = diff.ui.added[diff.ui.added.length - 1].child.nextElementSibling as Element;
                const item = this.component.elementCache.get(lastNextChild)?.item;
                for (let {child} of diff.ui.added) {
                    this.addMessageBefore(item, child);
                }
            }
        }
        for (let {item, child} of diff.ui.deleted) {
            item.Message.Context.RemoveMessage(item.Message);
        }

        for (let {item} of diff.model.added) {
            this.insert(item);
        }
        for (let {child, item} of diff.model.deleted) {
            this.component.contentEditable.removeChild(child);
            this.component.elementCache.remove(child);
        }
        for (let {child, item} of diff.model.updated) {
            this.setChildItem(child, item);
        }

    }

    private addMessageBefore(item: EditorItem, child: Element) {
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

    private setChildItem(child: Element, item: EditorItem) {
        if (child.textContent != item.Message.State.Content)
            child.textContent = item.Message.State.Content;
        const info = this.component.elementCache.get(child)
        if (info && info.item.Index !== item.Index) {
            this.component.contentEditable.insertBefore(child, this.component.contentEditable.childNodes[item.Index]);
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

    private insert(item: EditorItem) {
        const newNode = document.createElement('span');
        this.setChildItem(newNode, item);
        const child = this.component.contentEditable.childNodes[item.Index];
        if (child) {
            this.component.contentEditable.insertBefore(newNode, child);
        } else {
            this.component.contentEditable.appendChild(newNode);
        }
        return newNode;
    }

    fixChildren() {
        for (let child of Array.from(this.component.contentEditable.childNodes)) {
            if (child instanceof Comment)
                continue;
            const text = recursiveGetText(child);
            if (child instanceof HTMLSpanElement || (child as Element).localName === 'span')
                child.textContent = text;
            else {
                child.remove();
                const span = document.createElement('span')
                span.textContent = text;
                this.component.contentEditable.appendChild(span);
            }
        }
    }
}

export class Diff<TItem = EditorItem, TElement = Element> {
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

function recursiveGetText(node: Node) {
    if (node instanceof HTMLBRElement)
        return '';
    if (node instanceof Text)
        return node.textContent;
    if (node instanceof Comment)
        return '';
    const texts = [];
    for (let childNode of Array.from(node.childNodes)) {
        texts.push(recursiveGetText(childNode));
    }
    return texts.join('');
}