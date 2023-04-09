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
            for (let {child} of diff.ui.added) {
                this.addMessage(child);
            }
            // }
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

    private addMessage(child: Element) {
        const prev = child.previousElementSibling;
        const item = this.component.elementCache.get(prev)?.item;
        const context = item?.Message.SubContext ?? item?.Message.Context ?? this.component.ContextProxy;
        const index = item ? (item.Message.SubContext ? 0 : context.Messages.indexOf(item?.Message) + 1) : 0;
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
            Length: 0,
            get State(){
                return this.Message.State;
            },
            Index: (item?.Index ?? 0) + 1,
            Parent: item?.Parent
        } as EditorItem;
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
        if (child instanceof HTMLAnchorElement || child instanceof HTMLElement && child.localName === 'a') {
            const id = item.Path.join(':');
            child.id = id;
            child.className = `item level-${item.Path.length}`
            child.style.setProperty('--level', item.Path.length.toString());
            (child as HTMLAnchorElement).href = '/context/'+encodeURIComponent(btoa(item.Message.Context.State.URI));
            this.component.elementCache.set(id, item, child);
            // this.cache.set(item.Message, child);
        }
    }

    private insert(item: EditorItem) {
        const newNode = document.createElement('a');
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
            if (child instanceof HTMLAnchorElement || (child as Element).localName === 'a') {
                if (child.textContent !== text)
                    child.textContent = text;
            } else {
                child.remove();
                const span = document.createElement('a')
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
    if (node instanceof HTMLBRElement) {
        node.remove();
        return '';
    }
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