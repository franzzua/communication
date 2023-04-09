import {action, component, effect, ExtendedElement, HtmlComponent, KeyboardListener, property} from "@cmmn/ui";
import style from "./editor.style.less";
import {Fn, Injectable} from "@cmmn/core";
import {EditorSelection} from "./editor-selection";
import {cell} from "@cmmn/cell";
import {ContextProxy, DomainProxy, IContextProxy} from "@proxy";
import {Context, DomainState} from "@model";
import {EditorReducers} from "./editor.reducers";
import {Diff, DiffApply} from "./diff-apply";
import {Reducer} from "../reducers";
import {ContentEditableState, EditorItem} from "./types";
import {ElementCache} from "./element-cache";
import {EditorCollection} from "./editor-collection";
import {IEvents, IState, template} from "./editor.template";

@Injectable(true)
@component({name: 'ctx-editor', template, style})
export class EditorComponent extends HtmlComponent<IState, IEvents> {
    public static DebounceTime = 40;
    @property()
    private uri!: string;
    @property()
    private id: string = Fn.ulid();
    public elementCache = new ElementCache();

    @cell
    public get contentEditable(): HTMLElement{
        if (this.$render.get() == 0)
            return null;
        const element = this.element.querySelector('[contenteditable]') as HTMLDivElement;
        element.focus();
        return element;
    }
    private diffApply = new DiffApply(this);
    @cell
    Selection: EditorSelection = EditorSelection.GetCurrent(this.elementCache);

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
        if (!this.contentEditable)
            return null;
        return this.elementCache.getMergeDiff(this.ItemsCollection, this.contentEditable.firstElementChild,false);
    }

    @action(function (this: EditorComponent) {
        return this.root.State?.Networks;
    })
    private OnNetworkChanged(networks: DomainState["Networks"]) {
        if (!networks)
            return;
        for (let [uri, network] of networks.entries()) {
            const elements = this.elementCache.find(uri);
            for (let element of elements ?? []) {
                (element.element as Element).setAttribute('size', network.size.toString());
            }
        }
    }

    @action(function (this: EditorComponent) {
        return this.Diff;
    })
    private DiffAction(diff: {ui: Diff, model: Diff}) {
        if (!diff || (diff.ui.isEmpty() && diff.model.isEmpty()))
            return;
        this.diffApply.apply(diff);
        this.onSelectionChange();
    }

    @event('input')
    onInputEvent(e: Event) {
        // const selected = this.Selection?.Focus.item;
        this.diffApply.fixChildren();
        const diff = this.elementCache.getMergeDiff(this.ItemsCollection, this.contentEditable.firstElementChild, true);
        this.diffApply.apply(diff);
        // if (selected){
        //     const newSelected = this.diffApply.cache.get(selected.Message);
        //     this.Selection.set(newSelected);
        // }
        this.onSelectionChange();
    }



    @effect() initElement() {
        this.element.setAttribute('id', this.id);
        this.contentEditable.focus();
    }

    private keyboardListener = new KeyboardListener(this.contentEditable);

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

    @event(document, 'selectionchange')
    onSelectionChange() {
        if (this.Selection?.Focus.item?.element instanceof HTMLElement){
            this.Selection.Focus.item.element.style.color = null;
        }
        let selection = EditorSelection.GetCurrent(this.elementCache)
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
        return {
            Items: [...this.ItemsCollection]
        };
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

