import {action, component, effect, HtmlComponent, KeyboardListener, property} from "@cmmn/ui";
import style from "./content-editable.style.less";
import {TreeItem} from "../../presentors/tree.presentor";
import {Fn, Injectable} from "@cmmn/core";
import {ItemSelection} from "./itemSelection";
import {cell} from "@cmmn/cell";
import {ContextProxy, DomainProxy} from "@proxy";
import {Context} from "@model";
import {ContentEditableReducers, keyMap} from "./content-editable.reducers";
import {ItemsCollection} from "./items-collection";
import {DiffApply} from "./diff-apply";
import {Reducer} from "../reducers";
import {ContentEditableState} from "./types";

@Injectable(true)
@component({name: 'content-editable', template: () => void 0, style})
export class ContentEditableComponent extends HtmlComponent<void> {
    public static DebounceTime = 40;
    @property()
    private uri!: string;
    @property()
    private id: string = Fn.ulid();
    private diffApply = new DiffApply(this);
    @cell
    Selection: ItemSelection<TreeItem> = ItemSelection.GetCurrent();

    constructor(private root: DomainProxy,
                private reducers: ContentEditableReducers) {
        super();
        // Cell.OnChange(() => this.Items.toArray().map(x => x.Message.State), () => this.merge())
    }

    @cell({compareKey: a => a?.State, compare: Context.equals})
    get ContextProxy(): ContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    @cell
    get ItemsCollection(): ItemsCollection {
        return new ItemsCollection(this.ContextProxy);
    }

    @cell
    get Diff(){
        return this.diffApply.getMergeDiff(this.ItemsCollection, false);
    }

    @action(function (this: ContentEditableComponent) {
        return this.Diff;
    })
    private DiffAction(diff: any) {
        this.diffApply.apply(diff);
    }

    @event('input')
    onInputEvent(e: Event) {
        for (let i = 0; i < this.element.children.length; i++) {
            // @ts-ignore
            this.element.children[i].style.order = i;
        }
        const selected = this.Selection?.Focus.item;
        const diff = this.diffApply.getMergeDiff(this.ItemsCollection, true);
        this.diffApply.apply(diff);
        if (selected){
            const newSelected = this.diffApply.cache.get(selected.Message);
            this.Selection.set(newSelected);
        }
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
                this.InvokeAction(this.reducers[keyMap[modKey]](event as any));

                // this.$reducerState.Invoke(reducer);
            }
        })
    }

    @event(document, 'selectionchange')
    onSelectionChange() {
        const selection = ItemSelection.GetCurrent<TreeItem>();
        if (!selection)
            return;
        this.Selection = selection;
        this.InvokeAction(state => ({
            ...state,
            Selection: this.Selection
        }));
        console.log(
            this.id,
            // this.Items.toArray().indexOf(this.Selection?.Focus.item),
            this.Selection?.Focus.item?.Message.State.Content,
            this.Selection?.Focus.item?.Length,
        );
    }

    public get childNodes() {
        return (Array.from(this.element.childNodes) as Array<ItemElement>)
    }


    InvokeAction(reducer: Reducer<ContentEditableState> | Promise<Reducer<ContentEditableState>>) {
        Promise.resolve(reducer).then(x => x({
            Items: this.ItemsCollection,
            Selection: this.Selection
        })).catch(console.error)
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
