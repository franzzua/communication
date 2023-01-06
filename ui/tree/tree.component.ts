import {action, component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./tree.template";
import {ContextProxy, DomainProxy} from "@services";
import {keyMap, TreeReducers} from "./tree-reducers";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import {RouterService} from "../../app/services/router.service";
import {Injectable} from "@cmmn/core";
import {KeyboardAspect} from "../keyboardAspect";
import {Context} from "@model";
import style from "./tree.style.less";
import {Cell, cell} from "@cmmn/cell";
import {Reducer, ReducerQueueState} from "../reducers";
import {ObservableList} from "@cmmn/cell";
import {TreeState} from "./types";
import {effect} from "@cmmn/ui";
import {IContextProxy} from "@proxy";

@Injectable(true)
@component({name: 'ctx-tree', template, style})
export class TreeComponent extends HtmlComponent<IState, IEvents> implements IEvents {


    constructor(private root: DomainProxy,
                private routerService: RouterService,
                private presenter: TreePresenter,
                private treeStore: TreeReducers) {
        super();
    }

    private keyboard = new KeyboardAspect(this.element as HTMLElement);
    @property()
    private uri!: string;

    @cell
    get ContextProxy(): IContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    public $reducerState = new ReducerQueueState<TreeState>({
        Items: new ObservableList([]),
        Root: null,
        Selected: null,
        ItemsMap: new Map<string, TreeItem>()
    });

    async setFocus({item, index}: { item: TreeItem; index: number; }) {
        this.$reducerState.Invoke(this.treeStore.Focus(item));
    }

    updateMessage(x: { item: any; content: any; }) {
        this.$reducerState.Invoke(this.treeStore.UpdateContent(x));
    }

    addMessage(text: string) {
        throw new Error("Method not implemented.");
    }

    reduce(reducer: Reducer<TreeState>) {
        this.$reducerState.Invoke(reducer);
    }

    @action(function (this: TreeComponent) {
        return this.ContextProxy.Messages;
    })
    private InitAction() {
        const context = this.ContextProxy;
        if (!context)
            return;
        this.$reducerState.Invoke(this.treeStore.Init(context));
    }

    @effect()
    private KeyboardActions() {
        return this.keyboard.on('event', e => {
            if (e.modKey in keyMap) {
                e.event.preventDefault();
                const reducer = this.treeStore[keyMap[e.modKey]](e.event as any);
                this.$reducerState.Invoke(reducer);
            }
        })
    }

    get State() {
        const s = this.$reducerState.get();
        this.presenter.UpdateTree(s);
        return {
            Items: s.Items.toArray().slice(),
            Selected: s.Selected
        }
    }

}

