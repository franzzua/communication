import {action, component, effect, HtmlComponent, property} from "@cmmn/ui";
import style from "./content-editable.style.less";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import {compare, debounced, Fn, Injectable} from "@cmmn/core";
import {ItemSelection} from "./itemSelection";
import {cell, Cell, ObservableList} from "@cmmn/cell";
import {DomainProxy} from "@proxy";
import {Context} from "@model";
import {ContextProxy} from "@proxy";
import {ContentEditableState} from "./types";
import {ReducerQueueState} from "../reducers";
import {ContentEditableReducers} from "./content-editable.reducers";
import {utc} from "@cmmn/core";

@Injectable(true)
@component({name: 'content-editable', template: () => void 0, style})
export class ContentEditableComponent extends HtmlComponent<void> {
    @property()
    private uri!: string;

    @cell
    Selection: ItemSelection<TreeItem> = ItemSelection.GetCurrent();

    constructor(private root: DomainProxy,
                private presenter: TreePresenter,
                private reducers: ContentEditableReducers) {
        super();
        Cell.OnChange(() => this.Items.toArray().map(x => x.Message.State.id), {
            compare
        }, () => this.merge())
    }

    @cell({compareKey: a => a.State, compare: Context.equals})
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

    private addMessage(data: { item: TreeItem; content: string; }, child: ItemElement) {
        const index = data.item.Message.Context.Messages.indexOf(data.item.Message);
        const newMessage = data.item.Message.Context.CreateMessage({
            Content: data.content,
            id: Fn.ulid(),
            CreatedAt: utc(),
            UpdatedAt: utc(),
            ContextURI: data.item.Message.Context.State.URI,
        }, index);
        const newItem = {
            Message: newMessage,
            IsOpened: false,
            Path: data.item.Path.slice(0, -1).concat([newMessage.State.id]),
            Length: 0
        };
        const span = this.insertBefore(newItem, child);
    }

    @event('input')
    @debounced(40)
    merge(fromUI?: Event) {
        console.log(this.Items.toArray().map(x => x.Message.State.Content));
        const children = this.childNodes;
        const items = this.Items.toArray();
        const added = new Set(items);

        for (let child of children) {
            if (child instanceof  Comment)
                continue;
            if (child.item && !added.has(child.item)) {
                // Deleted in Model
                child.remove();
                continue;
            }
            const texts = recursiveGetText(child).split('\n');
            const content = texts.pop();
            if (child.item) {
                if (fromUI) {
                    // Updated in UI
                    if (child.item.Message.State.Content !== content) {
                        this.InvokeAction(this.reducers.UpdateContent({
                            item: child.item,
                            content: content
                        }));
                    }
                }else {
                    if (child.textContent !== child.item.Message.State.Content)
                        child.textContent = child.item.Message.State.Content
                }
            } else {
                // Added in UI
                const item = child.previousSibling.item;
                this.addMessage({item, content: content}, child)
            }
            if (child.innerHTML !== content)
                child.innerHTML = content;
            for (let content of texts) {
                // Added in UI
                const item = child.item;
                this.addMessage({item, content}, child)
            }

        }

        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            if (children[index]?.item == item) {
                continue;
            }
            if (fromUI) {
                // Deleted in UI
                item.Message.Actions.Remove();
                console.log('delete', item.Message.State.Content);
            } else {
                // Added in Model
                const newNode = this.insertBefore(item, children[index]);
                children.splice(index, 0, newNode);
            }
        }
    }

    private insertBefore(item: TreeItem, child: ItemElement) {
        const newNode = document.createElement('span') as ItemElement;
        newNode.item = item;
        newNode.index = child?.index ?? this.element.children.length;
        newNode.innerHTML = item.Message.State.Content;
        newNode.className = `item level-${item.Path.length}`
        newNode.style.setProperty('--level', item.Path.length.toString());
        if (child) {
            child.index++;
            this.element.insertBefore(newNode, child);
        } else {
            this.element.appendChild(newNode);
        }
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

export type ItemElement<T = TreeItem> = HTMLSpanElement & {
    item: T;
    index: number;
    previousSibling: ItemElement<T>;
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