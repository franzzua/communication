import {Fn, utc} from "@cmmn/core";
import {MessageProxy} from "@proxy";
import {TreeItem} from "../../presentors/tree.presentor";
import {ContentEditableComponent, ItemElement} from "./content-editable.component";

export class DiffApply {
    constructor(private component: ContentEditableComponent) {

    }

    cache = new Map<MessageProxy, ItemElement>();

    getMergeDiff(collection: Iterable<TreeItem>, fromUI: boolean) {
        this.fixChildren();
        const ui = new Diff();
        const model = new Diff();
        let currentChild = this.component.element.firstChild as ItemElement;
        // const state = {
        //     ui: [],
        //     model: []
        // }
        const children = new Set(Array.from(this.component.childNodes) as ItemElement[]);
        console.log('_____________');
        for (let item of collection) {
            // state.ui.push(currentChild?.textContent);
            // state.model.push(item.Message.State.Content);
            console.log(item.Path.map(() => '').join('\t')+item.Message.State.Content);
            while (currentChild && !currentChild.item) {
                // added in UI
                ui.added.push({
                    child: currentChild,
                    item: null
                });
                children.delete(currentChild);
                currentChild = currentChild.nextSibling;
            }
            if (!currentChild) {
                model.added.push({child: null, item});
                continue;
            }
            if (currentChild.item.Message == item.Message) {
                // updated but where?
                if (fromUI) {
                    if (currentChild.innerHTML !== item.Message.State.Content)
                        ui.updated.push({child: currentChild, item});
                } else {
                    model.updated.push({child: currentChild, item});
                }
                children.delete(currentChild);
                currentChild = currentChild.nextSibling;
                continue;
            }
            const child = this.cache.get(item.Message);
            if (!child) {
                // added in Model
                model.added.push({child: currentChild, item});
                continue;
            }
            children.delete(child);
            if (child.parentElement) {
                // deleted in Model
                model.updated.push({child, item});
            } else {
                // deleted in UI
                ui.deleted.push({child, item});
            }
        }
        for (let child of children) {
            // state.ui.push(child.textContent);
            if (child.item) {
                model.deleted.push({child, item: child.item});
            } else {
                ui.added.push({child, item: child.item});
            }
        }
        // console.table(state);
        console.table({
            ui: {
                updated: ui.updated.map(x => x.child.textContent).join(', '),
                deleted: ui.deleted.map(x => x.item.Message.State.Content).join(', '),
                added: ui.added.map(x => x.child.textContent).join(', '),
            },
            model: {
                updated: model.updated.map(x => x.item.Message.State.Content).join(', '),
                deleted: model.deleted.map(x => x.child.textContent).join(', '),
                added: model.added.map(x => x.item.Message.State.Content).join(', '),
            }
        })
        return {ui, model};
    }

    fixChildren() {
        for (let child of Array.from(this.component.element.children)) {
            if (child instanceof Comment)
                continue;
            const text = recursiveGetText(child);
            if (child instanceof HTMLSpanElement || child.localName === 'span')
                child.textContent = text;
            else {
                child.remove();
                const span = document.createElement('span')
                span.textContent = text;
                this.component.element.appendChild(span);
            }
        }
    }

    apply(diff: { ui: Diff, model: Diff }) {
        for (let {item, child} of diff.ui.updated) {
            item.Message.Actions.UpdateText(child.innerHTML);
        }
        if (diff.ui.added.length) {
            if (this.component.Selection) {
                const selected = this.component.Selection?.Focus.item;
                const selectedChild = this.cache.get(selected.Message);
                const lastAdded = diff.ui.added[diff.ui.added.length - 1];
                if (lastAdded.child.nextSibling !== selectedChild){
                    diff.ui.added.pop();
                    selected.Message.Actions.UpdateText(lastAdded.child.textContent);
                    lastAdded.child.item = selected;
                    lastAdded.child.index = selected.Index + diff.ui.added.length;
                    this.addMessageBefore(selected, selectedChild);
                }
                for (let { child} of diff.ui.added) {
                    this.addMessageBefore(selected, child);
                }
            }else {
                const lastNextItem = diff.ui.added[diff.ui.added.length - 1].child.nextSibling?.item;
                for (let {child} of diff.ui.added) {
                    this.addMessageBefore(lastNextItem, child);
                }
            }
        }
        for (let {item, child} of diff.ui.deleted) {
            item.Message.Actions.Remove();
        }

        for (let {item, child} of diff.model.added) {
            this.insertBefore(item, child);
        }
        for (let {child} of diff.model.deleted) {
            child.remove();
        }
        for (let {child, item} of diff.model.updated) {
            if (child.innerHTML != item.Message.State.Content)
                child.innerHTML = item.Message.State.Content;
            child.className = `item level-${item.Path.length}`
            child.style.setProperty('--level', item.Path.length.toString());
            child.item = item;
            if (child.index !== item.Index) {
                child.index = item.Index;
                this.component.element.insertBefore(child, this.component.childNodes[item.Index]);
            }
        }


    }

    private addMessageBefore(item: TreeItem, child: ItemElement) {
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
        child.index = (item?.Index ?? -1) + 1;
        child.item = newItem;
        return newItem;
    }


    private insertBefore(item: TreeItem, child: ItemElement) {
        const newNode = document.createElement('span') as ItemElement;
        this.cache.set(item.Message, newNode);
        newNode.item = item;
        newNode.index = item.Index;
        newNode.innerHTML = item.Message.State.Content;
        newNode.className = `item level-${item.Path.length}`
        newNode.style.setProperty('--level', item.Path.length.toString());
        // newNode.style.order = newNode.index.toString();
        if (child) {
            child.index++;
            this.component.element.insertBefore(newNode, child);
        } else {
            this.component.element.appendChild(newNode);
        }
        return newNode;
    }
}

export class Diff {
    deleted: { child?: ItemElement; item?: TreeItem }[] = [];
    added: { child?: ItemElement; item?: TreeItem }[] = [];
    updated: { child?: ItemElement; item?: TreeItem }[] = [];

    equals(diff: Diff){
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