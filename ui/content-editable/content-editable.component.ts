import {action, component, effect, HtmlComponent, property} from "@cmmn/ui";
import style from "./content-editable.style.less";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import {compare, debounce, debounced, Fn, Injectable} from "@cmmn/core";
import {ItemSelection} from "./itemSelection";
import {cell, Cell, ObservableList} from "@cmmn/cell";
import {DomainProxy} from "@proxy";
import {Context} from "@model";
import {ContextProxy} from "@proxy";
import {ContentEditableState} from "./types";
import {ReducerQueueState} from "../reducers";
import {ContentEditableReducers} from "./content-editable.reducers";
import {utc} from "@cmmn/core";
import {keyMap} from "../tree/tree-reducers";
import {KeyboardListener} from "@cmmn/ui";
import {mergeFromModel, mergeFromUI} from "./merge";

@Injectable(true)
@component({name: 'content-editable', template: () => void 0, style})
export class ContentEditableComponent extends HtmlComponent<void> {
    public static DebounceTime = 40;
    @property()
    private uri!: string;
    @property()
    private id: string = Fn.ulid();

    @cell
    Selection: ItemSelection<TreeItem> = ItemSelection.GetCurrent();

    constructor(private root: DomainProxy,
                private presenter: TreePresenter,
                private reducers: ContentEditableReducers) {
        super();
        Cell.OnChange(() => this.Items.toArray().map(x => x.Message.State), {
            compare
        }, () => this.merge())
    }

    @cell({compareKey: a => a?.State, compare: Context.equals})
    get ContextProxy(): ContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    public $reducerState = new ReducerQueueState<ContentEditableState>({
        Items: new ObservableList(),
        Root: null,
        Selection: null,
        ItemsMap: new Map<string, TreeItem>()
    });

    public get Items() {
        const s = this.$reducerState.get();
        this.presenter.UpdateTree(s);
        return s.Items;
    }

    @action(function (this: ContentEditableComponent) {
        return this.ContextProxy?.State.URI;
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
        this.element.setAttribute('id', this.id);
        this.element.focus();
    }
    private keyboardListener = new KeyboardListener(this.element);

    @effect()
    private listenKeyboard() {
        return this.keyboardListener.on('keydown', event => {
            const modifiers = ['Alt', 'Ctrl', 'Shift'].filter(x => event[x.toLowerCase() + 'Key']);
            const modKey = modifiers.join('') + event.code;
            if (modKey in keyMap) {
                event.preventDefault();
                const reducer = this.reducers[keyMap[modKey]](event as any);
                this.$reducerState.Invoke(reducer);
            }
        })
    }

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
        // console.log(
        //     this.id,
        //     this.Items.toArray().indexOf(this.Selection?.Focus.item),
        //     this.Selection?.Focus.item?.Message.State.Content,
        //     this.Selection?.Focus.item?.Length,
        // );
    }

    public get childNodes() {
        return (Array.from(this.element.childNodes) as Array<ItemElement>)
            .orderBy(x => x.style.order);
    }

    private addMessageAfter(item: TreeItem, content: string, child: ItemElement) {
        const context = item?.Message.Context ?? this.$reducerState.get().Root;
        const index = context.Messages.indexOf(item?.Message);
        const newMessage = context.CreateMessage({
            Content: content,
            id: Fn.ulid(),
            CreatedAt: utc(),
            UpdatedAt: utc(),
            ContextURI: context.State.URI,
        }, index + 1);
        const newItem = {
            Message: newMessage,
            IsOpened: false,
            Path: (item?.Path.slice(0, -1) ?? []).concat([newMessage.State.id]),
            Length: 0
        };
        child.index = (child?.previousSibling?.index ?? -1) + 1;
        child.item = newItem;
        return newItem;
    }

    @event('input')
    onInputEvent(e: Event) {
        this.mergeDebounced(true);
    }
    merge(fromUI?: boolean) {
        if (fromUI) {
            const diff = mergeFromUI(this.Items.toArray(), this.childNodes);
            for (let [message, change] of diff.update) {
                message.Actions.UpdateText(change.content);
            }
            for (let {item, content, child} of diff.add) {

                this.addMessageAfter(item, content, child);
            }
            for (let message of diff.delete) {
                message.Actions.Remove();
            }
        }else{
            const diff = mergeFromModel(this.Items.toArray(), this.childNodes);
            // console.log(diff)
            for (let {item, before} of diff.add) {
                this.insertBefore(item, before);
            }
            for (let child of diff.delete) {
                child.remove();
            }
            for (let [child, {content, index}] of diff.update) {
                child.innerHTML = content
                child.index = index;
                child.style.order = index.toString();
            }
        }
    }

    private mergeDebounced = debounce(this.merge.bind(this), ContentEditableComponent.DebounceTime);

    private insertBefore(item: TreeItem, child: ItemElement) {
        const newNode = document.createElement('span') as ItemElement;
        newNode.item = item;
        newNode.index = child?.index ?? this.element.children.length;
        newNode.innerHTML = item.Message.State.Content;
        newNode.className = `item level-${item.Path.length}`
        newNode.style.setProperty('--level', item.Path.length.toString());
        newNode.style.order = newNode.index.toString();
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
                const current = element ?? instance.element;
                const listener = instance[key].bind(instance);
                current.addEventListener(name, listener, options);
                instance.once('dispose', () => {
                    current.removeEventListener(name, listener, options)
                });
            }
        });
        return descr;
    }
}

export type ItemElement<T = TreeItem> = HTMLSpanElement & {
    item: T;
    index: number;
    previousSibling: ItemElement<T>;
    nextSibling: ItemElement<T>;
}
