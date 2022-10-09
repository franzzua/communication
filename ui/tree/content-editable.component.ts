import {component, effect, HtmlComponent, property} from "@cmmn/ui";
import {ContentEditableTemplate, IState} from "./content-editable.template";
import style from "./content-editable.style.less";
import {TreeItem} from "../../presentors/tree.presentor";
import {debounced, Injectable} from "@cmmn/core";
import {TreeReducers} from "./tree-reducers";
import {ItemSelection} from "./itemSelection";
import {cell, Cell, ObservableList} from "@cmmn/cell";

@Injectable(true)
@component({ name: 'content-editable', template: ContentEditableTemplate, style })
export class ContentEditableComponent extends HtmlComponent<IState> {
    @property()
    Items: ObservableList<TreeItem>;
    @cell
    Selection: ItemSelection<TreeItem> = ItemSelection.GetCurrent();

    constructor(private treeStore: TreeReducers) {
        super();
        Cell.OnChange(() => this.Items, () => this.merge())
    }

    @effect()
    initElement() {
        this.element.setAttribute('contenteditable', '')
        this.element.setAttribute('autofocus', '')
        this.element.setAttribute('tabindex', '0');
        this.element.focus();
    }

    // @event('click')
    // onClick(e: PointerEvent) {
    //     const item = e.target['item'] as TreeItem;
    //     this.InvokeAction(this.treeStore.Focus(item));
    // }

    @event(document, 'selectionchange')
    onSelectionChange(e: Event) {
        this.Selection = ItemSelection.GetCurrent();
        this.InvokeAction(state => ({
            ...state,
            Selection: this.Selection
        }));
        console.log(
            this.Items.toArray().indexOf(this.Selection?.Focus.node.item),
            this.Selection?.Focus.node.innerText,
            this.Selection?.Focus.node.item?.Message.State.Content,
            this.Selection?.Focus.node.item?.Length,

        );
    }

    get childNodes() {
        return Array.from(this.element.childNodes) as Array<HTMLSpanElement & { item: TreeItem; index: number; }>;
    }

    @event('input')
    @debounced(40)
    merge(fromUI?: Event) {
        console.log(this.Items.toArray().map(x => x.Message.State.Content));
        const added = new Set(this.Items.toArray());
        const children = this.childNodes;
        for (let index = 0; index < children.length; index++) {
            const node = children[index];
            if (!node.item) {
                // Add item
                if (node instanceof Comment) {
                    continue;
                }
                const content = node.textContent;
                if (node.childNodes.length > 1 || !(node.firstChild instanceof Text))
                    node.innerHTML = content;
                this.InvokeAction(this.treeStore.AddChild(content));
                node.remove();
                console.log('add', content, index);
            } else {
                added.delete(node.item);
                const index = this.Items.toArray().indexOf(node.item);
                if (index == -1) {
                    node.remove();
                    continue;
                }
                node.index = index;
                node.style.order = index.toString();
                const item = node.item;
                for (let child of Array.from(node.children)) {
                    if (child instanceof HTMLSpanElement) {
                        node.insertBefore(new Text(child.innerText), child);
                        child.remove();
                    }
                }
                const content = node.innerText;
                if (content == item.Message.State.Content)
                    continue;
                if (!content.match('\n')) {
                    if (node.childNodes.length > 1 || !(node.firstChild instanceof Text))
                        node.innerHTML = content;
                    if (node.item.Message.State.Content !== content) {
                        console.log('update', content, index);
                        this.InvokeAction(this.treeStore.UpdateContent({
                            content, item
                        }));
                    }
                } else {
                    const [first, ...other] = content.split('\n').map(x => x.trim()).filter(x => x);
                    node.innerText = first ?? '';
                    this.InvokeAction(this.treeStore.UpdateContent({
                        content: first, item
                    }));
                    for (let i = 0; i < other.length; i++) {
                        // this.InvokeAction(this.treeStore.AddMessage(
                        //     {item, index: index + 1 + i, content: other[i]}
                        // ));
                    }
                }
            }
        }
        const children2 = this.childNodes;
        for (let item of added) {
            if (fromUI) {
                this.InvokeAction(this.treeStore.Remove(item));
                console.log('delete', item.Message.State.Content);
            } else {
                const index = this.Items.toArray().indexOf(item);
                const newNode = document.createElement('span') as HTMLSpanElement & { item: TreeItem; index: number; };
                newNode.item = item;
                newNode.index = index;
                newNode.innerHTML = item.Message.State.Content;
                newNode.className = `item level-${item.Path.length}`
                newNode.style.order = index.toString();
                this.element.insertBefore(newNode, children2[index + 1]);
                children2.splice(index, 0, newNode);
                console.log('append', newNode.textContent, index + 1);
            }
        }
        // for (let index = 0, node = this.element.firstChild as HTMLSpanElement & { item: TreeItem; index: number; };
        //      (index < this.Items.length) || node;) {
        //     const item = this.Items.get(index);
        //     if (item && node && node.item === item) {
        //         const content = node.innerText;
        //         if (!content.match('\n')) {
        //             if (node.childNodes.length > 1 || !(node.firstChild instanceof Text))
        //                 node.innerHTML = content;
        //             if (item.Message.State.Content !== content) {
        //                 console.log('update', content, index);
        //                 this.InvokeAction(this.treeStore.UpdateContent({
        //                     content, item
        //                 }));
        //             }
        //         } else {
        //             const [ first, ...other ] = content.split('\n').map(x => x.trim());
        //             this.InvokeAction(this.treeStore.UpdateContent({
        //                 content: first, item
        //             }));
        //             for (let i = 0; i < other.length; i++) {
        //                 this.InvokeAction(this.treeStore.AddMessage(
        //                     item, index + 1 + i, other[i]
        //                 ));
        //             }
        //         }
        //         index++;
        //         node = node.nextSibling as HTMLSpanElement & { item: TreeItem; index: number; };
        //     } else if (item && !node && !fromUI) {
        //         const newNode = document.createElement('span') as HTMLSpanElement & { item: TreeItem; index: number; };
        //         newNode.item = item;
        //         newNode.index = index;
        //         newNode.innerHTML = item.Message.State.Content;
        //         newNode.className = `item level-${item.Path.length}`
        //         this.element.insertBefore(newNode, node);
        //         console.log('append', newNode.textContent)
        //         index++;
        //     } else if (!item || (node && !node.item)) {
        //         // Add item
        //         if (node instanceof Comment) {
        //             node = node.nextSibling as HTMLSpanElement & { item: TreeItem; index: number; };
        //             continue;
        //         }
        //         const content = node.textContent;
        //         if (node.childNodes.length > 1 || !(node.firstChild instanceof Text))
        //             node.innerHTML = content;
        //         this.InvokeAction(this.treeStore.AddMessage(this.Items.get(0), index, content));
        //         console.log('add', content, index);
        //         const nextNode = node.nextSibling as HTMLSpanElement & { item: TreeItem; index: number; };
        //         node.remove();
        //         node = nextNode;
        //     } else {
        //         // Delete item
        //         this.InvokeAction(this.treeStore.Remove(item));
        //         index++;
        //         // node = node.nextElementSibling as HTMLSpanElement & { item: TreeItem; index: number; };
        //         console.log('remove', index);
        //     }
        // }
        // if (this.Selection.Direction == 'ltr') {
        //     for (let i = this.Selection.Anchor.node.index + 1; i <= this.Selection.Focus.node.index; i++) {
        //         const treeItem = this.Items.get(i);
        //         console.log('remove', treeItem.Message.State.Content);
        //         this.InvokeAction(this.treeStore.Remove(treeItem));
        //     }
        // } else {
        //     for (let i = this.Selection.Focus.node.index + 1; i <= this.Selection.Anchor.node.index; i++) {
        //         const treeItem = this.Items.get(i);
        //         console.log('remove', treeItem.Message.State.Content);
        //         this.InvokeAction(this.treeStore.Remove(treeItem));
        //     }
        // }
        // this.Selection = Selection.GetCurrent();
        // const node = this.Selection.Focus.node;
        // const item = node.item;
        // const content = node.textContent;
        // if (node.childNodes.length > 1 || !(node.firstChild instanceof Text))
        //     node.innerHTML = content;
        // this.InvokeAction(this.treeStore.UpdateContent({
        //     content, item
        // }));
    }

    InvokeAction(reducer) {
        this.element.dispatchEvent(new CustomEvent('action', {
            detail: reducer
        }));
    }

    get State() {
        return null;
    }
}

export function event(target: EventTarget, name: keyof HTMLElementEventMap, options?: boolean | AddEventListenerOptions)
export function event(name: keyof HTMLElementEventMap, options?: boolean | AddEventListenerOptions)
export function event(nameOrTarget: keyof HTMLElementEventMap | EventTarget,
                      optionsOrTarget: boolean | AddEventListenerOptions | string,
                      options?: boolean | AddEventListenerOptions) {
    let element = (typeof nameOrTarget === "string" ? null : nameOrTarget) as EventTarget;
    const name = (typeof nameOrTarget === "string" ? nameOrTarget : optionsOrTarget) as keyof HTMLElementEventMap;
    options = (typeof nameOrTarget === "string" ? optionsOrTarget : options) as boolean | AddEventListenerOptions;
    return (target, key, descr) => {
        HtmlComponent.GlobalEvents.on('connected', instance => {
            if (instance instanceof target.constructor) {
                element ??= instance.element;
                const listener = instance[key].bind(instance);
                element.addEventListener(name, listener, options);
                instance.once('dispose', () => element.removeEventListener(name, listener, options));
            }
        });
        return descr;
    }
}