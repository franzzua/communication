import {TreeItem} from "../../presentors/tree.presentor";
import {ItemElement} from "./content-editable.component";
import {MessageProxy} from "@proxy";

export function mergeFromUI(this: void, items: TreeItem[], children: ItemElement[]): Diff<MessageProxy>{
    const diff = new Diff<MessageProxy>();
    const existed = new Set(items.map(x => x.Message));
    let lastExistedItem:TreeItem = null;
    for (let index = 0; index < children.length; index++){
        let child = children[index];
        if (child instanceof Comment)
            continue;

        const texts = recursiveGetText(child).split('\n');
        const content = texts.pop();
        if (child.innerHTML !== content)
            child.innerHTML = content;
        for (let content of texts) {
            // Added in UI
            diff.add.push({
                content, child, item: lastExistedItem
            })
        }
        if (!child.item) {
            // Added in UI
            diff.add.push({
                content, child, item: lastExistedItem
            })
            continue;
        }
        if (child.item.Message.State.Content !== content) {
            // Updated in UI
            diff.update.set(child.item.Message, {
                content
            });
        }
        existed.delete(child.item.Message);
        lastExistedItem = child.item;
    }
    for (let message of existed) {
        diff.delete.push(message);
    }

    return diff;
}

export function mergeFromModel(this: void, items: TreeItem[], children: ItemElement[]){
    const diff = new Diff<ItemElement>();
    const existed = new Map(children.map(x => [x.item.Message, x]));

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const child = existed.get(item.Message);
        if (!child) {
            // Added in Model
            diff.add.push({item, before: children[index]})
            continue;
        }
        existed.delete(item.Message);

        // Updated in Model
        if (child.innerHTML == child.item.Message.State.Content &&
            child.index == index) {
            continue;
        }
        diff.update.set(child, {
            content: child.item.Message.State.Content,
            index
        });
        if (child.index !== index){
            const tmp = children[index];
            children[index] = child;
            children[child.index] = tmp;
        }
    }

    for (let [message, child] of existed) {
        if (child instanceof Comment)
            continue;
        if (!child.item)
            continue;
        // Deleted in Model
        diff.delete.push(child);
        items.remove(child.item);
        children.remove(child);
    }

    return diff;
}


function recursiveGetText(node: Node) {
    if (node instanceof HTMLBRElement)
        return '\n';
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

export class Diff<T, TChange = any> {
    public add: any[] = [];
    public update = new Map<T, TChange>();
    public delete: T[] = [];
}