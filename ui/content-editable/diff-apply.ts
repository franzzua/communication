import {Fn, utc} from "@cmmn/core";
import {MessageProxy} from "@proxy";
import {TreeItem} from "../../presentors/tree.presentor";
import {ContentEditableComponent, ItemElement} from "./content-editable.component";
import {ElementCache} from "./element-cache";
import {it} from "@jest/globals";

export class DiffApply {
    constructor(private component: ContentEditableComponent) {

    }
    // private itemElements = new ItemElementMapping();
    // cache = new Map<MessageProxy, ItemElement>();
    private elementCache = new ElementCache<TreeItem, Node>();


    getMergeDiff(collection: Iterable<TreeItem>, fromUI: boolean) {
        this.fixChildren();
        return this.elementCache.getMergeDiff(collection, this.component.element.firstChild, fromUI);
        // const ui = new Diff();
        // const model = new Diff();
        // let currentChild = this.component.element.firstChild as ItemElement;
        // // const state = {
        // //     ui: [],
        // //     model: []
        // // }
        // const children = new Set(Array.from(this.component.childNodes) as ItemElement[]);
        // // console.log('_____________');
        // for (let item of collection) {
        //     // state.ui.push(currentChild?.textContent);
        //     // state.model.push(item.Message.State.Content);
        //     // console.log(item.Path.map(() => '').join('\t')+item.Message.State.Content);
        //     while (currentChild && !currentChild.item) {
        //         // added in UI
        //         ui.added.push({
        //             child: currentChild,
        //             item: null
        //         });
        //         children.delete(currentChild);
        //         currentChild = currentChild.nextSibling;
        //     }
        //     if (!currentChild) {
        //         model.added.push({child: null, item});
        //         continue;
        //     }
        //     console.log('child', (currentChild.textContent??'null')||'-', 'item',
        //         item.Message.State.Content||'-', item.Index);
        //     if (!currentChild.parentElement) {
        //         // deleted in UI
        //         ui.deleted.push({child: currentChild, item});
        //         children.delete(currentChild);
        //         continue;
        //     }
        //     if (currentChild.item.Message == item.Message) {
        //         // updated but where?
        //         if (fromUI) {
        //             if (currentChild.innerHTML !== item.Message.State.Content)
        //                 ui.updated.push({child: currentChild, item});
        //         } else if (this.isUpdateNeeded(currentChild, item)) {
        //             model.updated.push({child: currentChild, item});
        //         }
        //         children.delete(currentChild);
        //         currentChild = currentChild.nextSibling;
        //         continue;
        //     }
        //     const child = this.cache.get(item.Message);
        //     if (!child) {
        //         // added in Model
        //         model.added.push({child: currentChild, item});
        //         continue;
        //     }
        //     children.delete(child);
        //     if (child.parentElement) {
        //         if (this.isUpdateNeeded(child, item)) {
        //             // moved in Model
        //             model.updated.push({child, item});
        //         }
        //     } else {
        //         // deleted in UI
        //         ui.deleted.push({child, item});
        //     }
        // }
        // for (let child of children) {
        //     // state.ui.push(child.textContent);
        //     if (child.item) {
        //         model.deleted.push({child, item: child.item});
        //     } else {
        //         ui.added.push({child, item: child.item});
        //     }
        // }
        // if (model.added.length > 0 && model.deleted.length > 0){
        //     for (let added of model.added.slice()) {
        //         const deleted = model.deleted.find(x => x.child.index == added.child.index);
        //         if (deleted){
        //             model.added.remove(added);
        //             model.deleted.remove(deleted);
        //             model.updated.push(added);
        //         }
        //     }
        // }
        // // console.table(state);
        // if (!ui.isEmpty() || !model.isEmpty()) {
        //     console.table({
        //         ui: {
        //             updated: ui.updated.map(x => x.child.textContent || '-').join(', '),
        //             deleted: ui.deleted.map(x => x.item.Message.State.Content || '-').join(', '),
        //             added: ui.added.map(x => x.child.textContent || '-').join(', '),
        //         },
        //         model: {
        //             updated: model.updated.map(x => x.item.Message.State.Content || '-').join(', '),
        //             deleted: model.deleted.map(x => x.child.textContent || '-').join(', '),
        //             added: model.added.map(x => x.item.Message.State.Content || '-').join(', '),
        //         }
        //     })
        // }
        // return {ui, model};
    }

    // isUpdateNeeded(child: ItemElement, item: TreeItem){
    //     return !child.updatedAt.equals(item.Message.State.UpdatedAt) ||
    //         child.index !== item.Index ||
    //         child.id !== item.Path.join(':')
    // }

    fixChildren() {
        for (let child of Array.from(this.component.element.childNodes)) {
            if (child instanceof Comment)
                continue;
            const text = recursiveGetText(child);
            if (child instanceof HTMLSpanElement || (child as HTMLElement).localName === 'span')
                child.textContent = text;
            else {
                child.remove();
                const span = document.createElement('span')
                span.textContent = text;
                this.component.element.appendChild(span);
            }
        }
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
                const selectedChild = this.elementCache.get(selected);
                // selected element children belongs to last element
                const lastAdded = diff.ui.added[diff.ui.added.length - 1];
                if (lastAdded.child.nextSibling !== selectedChild.element) {
                    diff.ui.added.pop();
                    selected.Message.UpdateContent(lastAdded.child.textContent);
                    this.setChildItem(lastAdded.child, selected);
                    diff.ui.added.unshift({child: selectedChild.element, item: null});
                }
                for (let {child} of diff.ui.added) {
                    this.addMessageBefore(selected, child);
                }
            } else {
                const lastNextChild = diff.ui.added[diff.ui.added.length - 1].child.nextSibling;
                const item = this.elementCache.get(lastNextChild)?.item;
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
            this.elementCache.remove(child);
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
        const info = this.elementCache.get(child)
        if (info && info.item.Index !== item.Index) {
            this.component.element.insertBefore(child, this.component.childNodes[item.Index]);
        }
        if (child instanceof HTMLSpanElement || child instanceof HTMLElement && child.localName === 'span') {
            const id = item.Path.join(':');
            child.id = id;
            child.className = `item level-${item.Path.length}`
            child.style.setProperty('--level', item.Path.length.toString());
            this.elementCache.set(id, item, child);
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