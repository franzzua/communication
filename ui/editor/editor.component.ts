import {action, component, effect, HtmlComponent, KeyboardListener, property} from "@cmmn/ui";
import style from "./editor.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {ItemSelection} from "./itemSelection";
import {cell} from "@cmmn/cell";
import {ContextProxy, DomainProxy, IContextProxy} from "@proxy";
import {Context} from "@model";
import {EditorReducers} from "./editor.reducers";
import {DiffApply} from "./diff-apply";
import {Reducer} from "../reducers";
import {ContentEditableState, EditorItem} from "./types";
import {DateTime} from "luxon";
import {ElementCache} from "./element-cache";
import {EditorCollection} from "./editor-collection";

@Injectable(true) @component({name: 'ctx-editor', template: () => void 0, style})
export class EditorComponent extends HtmlComponent<void> {
    public static DebounceTime = 40;
    @property()
    private uri!: string;
    @property()
    private id: string = Fn.ulid();
    public elementCache = new ElementCache<EditorItem, Node>();
    private diffApply = new DiffApply(this);
    @cell
    Selection: ItemSelection = ItemSelection.GetCurrent(this.elementCache);

    constructor(private root: DomainProxy, private reducers: EditorReducers) {
        super();
        // Cell.OnChange(() => this.Items.toArray().map(x => x.Message.State), () => this.merge())
    }

    @cell({compareKey: a => a?.State, compare: Context.equals}) get ContextProxy(): IContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    @cell get ItemsCollection(): EditorCollection {
        return new EditorCollection(this.ContextProxy);
    }

    @cell get Diff() {
        return this.elementCache.getMergeDiff(this.ItemsCollection, this.element.firstChild,false);
    }

    @action(function (this: EditorComponent) {
        return this.Diff;
    })
    private DiffAction(diff: any) {
        this.diffApply.apply(diff);
        this.onSelectionChange();
    }

    @event('input') onInputEvent(e: Event) {
        // const selected = this.Selection?.Focus.item;
        this.fixChildren();
        const diff = this.elementCache.getMergeDiff(this.ItemsCollection, this.element.firstChild, true);
        this.diffApply.apply(diff);
        // if (selected){
        //     const newSelected = this.diffApply.cache.get(selected.Message);
        //     this.Selection.set(newSelected);
        // }
        this.onSelectionChange();
    }

    fixChildren() {
        for (let child of Array.from(this.element.childNodes)) {
            if (child instanceof Comment)
                continue;
            const text = recursiveGetText(child);
            if (child instanceof HTMLSpanElement || (child as HTMLElement).localName === 'span')
                child.textContent = text;
            else {
                child.remove();
                const span = document.createElement('span')
                span.textContent = text;
                this.element.appendChild(span);
            }
        }
    }



    @effect() initElement() {
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
            if (modKey in EditorReducers.KeyMap) {
                event.preventDefault();
                this.InvokeAction(EditorReducers.KeyMap[modKey].call(this.reducers, event as any));

                // this.$reducerState.Invoke(reducer);
            }
        })
    }

    @event(document, 'selectionchange') onSelectionChange() {
        if (this.Selection?.Focus.item?.element instanceof HTMLElement){
            this.Selection.Focus.item.element.style.color = null;
        }
        let selection = ItemSelection.GetCurrent(this.elementCache)
            ?? this.Selection?.Update(this.elementCache);
        if (!selection)
            return;
        this.Selection = selection;
        this.InvokeAction(state => ({
            ...state, Selection: this.Selection
        }));
        if (this.Selection?.Focus.item.element instanceof HTMLElement){
            this.Selection.Focus.item.element.style.color = 'white';
        }
        // const childSelected = this.diffApply.cache.get(this.Selection.Focus.item.Message);
        // if (childSelected) {
        //     childSelected.style.color = 'white';
        // }
    }

    InvokeAction(reducer: Reducer<ContentEditableState> | Promise<Reducer<ContentEditableState>>) {
        Promise.resolve(reducer).then(x => x({
            Items: this.ItemsCollection, Selection: this.Selection
        })).catch(console.error)
    }

    get State() {
        return null;
    }
}

export function event(target: EventTarget, name: keyof HTMLElementEventMap, options?: boolean | AddEventListenerOptions)
export function event(name: keyof HTMLElementEventMap, options?: boolean | AddEventListenerOptions)
export function event(nameOrTarget: keyof HTMLElementEventMap | EventTarget, optionsOrTarget: boolean | AddEventListenerOptions | string, options?: boolean | AddEventListenerOptions) {
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