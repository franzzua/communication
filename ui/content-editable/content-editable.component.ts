import {action, component, effect,  HtmlComponent, property} from "@cmmn/ui";
import style from "./content-editable.style.less";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import {compare, debounced, Injectable} from "@cmmn/core";
import {ItemSelection} from "./itemSelection";
import {cell, Cell, ObservableList} from "@cmmn/cell";
import {DomainProxy} from "@proxy";
import {RouterService} from "../../app/services/router.service";
import {Context} from "@model";
import { ContextProxy } from "@proxy";
import {ContentEditableState} from "./types";
import {ReducerQueueState} from "../reducers";
import {ContentEditableReducers} from "./content-editable.reducers";

@Injectable(true)
@component({name: 'content-editable', template: null, style})
export class ContentEditableComponent extends HtmlComponent<void> {
    @property()
    private uri!: string;

    @cell
    Selection: ItemSelection<TreeItem> = ItemSelection.GetCurrent();

    constructor(private root: DomainProxy,
                private routerService: RouterService,
                private presenter: TreePresenter,
                private reducers: ContentEditableReducers) {
        super();
        Cell.OnChange(() => this.Items.toArray().map(x => x.Message.State.id), {
            compare
        }, () => this.merge())
    }

    @cell({ compareKey: a => a.State, compare: Context.equals })
    get ContextProxy(): ContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    public $reducerState = new ReducerQueueState<ContentEditableState>({
        Items: new ObservableList(),
        Root: null,
        Selection: null,
        ItemsMap: new Map<string, TreeItem>()
    });

    get Items() {
        const s = this.$reducerState.get();
        this.presenter.UpdateTree(s);
        return s.Items;
    }

    @action(function (this: ContentEditableComponent) {
        return this.ContextProxy.State.URI;
    })
    private InitAction() {
        const context = this.ContextProxy;
        if (context)
            this.$reducerState.Invoke(this.reducers.Init(context));
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
        const selection = ItemSelection.GetCurrent<TreeItem>();
        if (!selection)
            return;
        this.Selection = selection;
        this.InvokeAction(state => ({
            ...state,
            Selection: this.Selection
        }));
        console.log(
            this.Items.toArray().indexOf(this.Selection?.Focus.item),
            this.Selection?.Focus.item?.Message.State.Content,
            this.Selection?.Focus.item?.Length,
        );
    }

    get childNodes() {
        return Array.from(this.element.childNodes) as Array<ItemElement>;
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
                this.InvokeAction(this.reducers.AddChild(content));
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
                const content = (node as HTMLSpanElement).innerText;
                if (content == item.Message.State.Content)
                    continue;
                if (!content.match('\n')) {
                    if (node.childNodes.length > 1 || !(node.firstChild instanceof Text))
                        node.innerHTML = content;
                    if (node.item.Message.State.Content !== content) {
                        console.log('update', content, index);
                        this.InvokeAction(this.reducers.UpdateContent({
                            content, item
                        }));
                    }
                } else {
                    const [first, ...other] = content.split('\n').map(x => x.trim()).filter(x => x);
                    (node as HTMLSpanElement).innerText = first ?? '';
                    this.InvokeAction(this.reducers.UpdateContent({
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
                item.Message.Actions.Remove();
                // this.InvokeAction(this.treeStore.Remove(item));
                console.log('delete', item.Message.State.Content);
            } else {
                const index = this.Items.toArray().indexOf(item);
                const newNode = this.createNode(item, index);
                this.element.insertBefore(newNode, children2[index + 1]);
                children2.splice(index, 0, newNode);
                console.log('append', newNode.textContent, index + 1);
            }
        }
    }

    private createNode(item: TreeItem, index: number) {
        const newNode = document.createElement('span') as ItemElement;
        newNode.item = item;
        newNode.index = index;
        newNode.innerHTML = item.Message.State.Content;
        newNode.className = `item level-${item.Path.length}`
        newNode.style.setProperty('level', '1');
        return newNode;
    }

    InvokeAction(reducer) {
        this.$reducerState.Invoke(reducer);
        // this.element.dispatchEvent(new CustomEvent('action', {
        //     detail: reducer
        // }));
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

export type ItemElement<T = TreeItem> = HTMLSpanElement & {item: T; index: number;}