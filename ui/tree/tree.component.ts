import { action, component, HtmlComponent, property } from "@cmmn/ui";
import { IEvents, IState, TreeTemplate } from "./tree.template";
import { ContextProxy, DomainProxy } from "@services";
import {keyMap, TreeReducers} from "./tree-reducers";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";
import { RouterService } from "../../app/services/router.service";
import { AsyncQueue, Injectable } from "@cmmn/core";
import { KeyboardAspect } from "./keyboardAspect";
import { Context } from "@model";
import style from "./tree.style.less";
import { Cell, cell } from "@cmmn/cell";
import { ObservableList } from "@cmmn/cell";

@Injectable(true)
@component({ name: 'ctx-tree', template: TreeTemplate, style })
export class TreeComponent extends HtmlComponent<Pick<IState, "Items">, IEvents> implements IEvents {


    constructor(private root: DomainProxy,
                private routerService: RouterService,
                private presenter: TreePresenter,
                private treeStore: TreeReducers) {
        super();
    }

    private keyboard = new Cell(new KeyboardAspect(this.element as HTMLElement));
    @property()
    private uri!: string;

    @cell({ compareKey: a => a.State, compare: Context.equals })
    get ContextProxy(): ContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    public $reducerState = new ReducerQueueState<IState>({
        Items: new ObservableList(),
        Root: null,
        Selection: null,
        ItemsMap: new Map<string, TreeItem>()
    });

    InvokeAction(reducer: Reducer<IState>) {
        this.$reducerState.Invoke(reducer);
    }

    @action(function (this: TreeComponent) {
        return this.ContextProxy.State;
    })
    private InitAction() {
        const context = this.ContextProxy;
        if (context)
            this.$reducerState.Invoke(this.treeStore.Init(context));
    }

    @action(function (this: TreeComponent) {
        return this.keyboard.get();
    })
    private KeyboardActions() {
        const eventQueue = this.keyboard.get().EventQueue;
        eventQueue.forEach(({ event, modKey }: { event: KeyboardEvent, modKey: string }) => {
            if (modKey in keyMap) {
                event.preventDefault();
                const reducer = this.treeStore[keyMap[modKey]](event as any);
                this.$reducerState.Invoke(reducer);
            }
        })
    }

    get State() {
        const s = this.$reducerState.get();
        this.presenter.UpdateTree(s);
        return {
            Items: s.Items,
        }
    }

}

// export type TransformResult<T> = T | Promise<T>;
export type Reducer<T> = (t: T) => T;

export class ReducerQueueState<TState> extends Cell<TState> {
    private asyncQueue = new AsyncQueue()

    public Invoke(reducer: Promise<Reducer<TState>> | Reducer<TState>) {
        if (reducer instanceof Promise) {
            this.asyncQueue.Invoke(() => reducer.then(reducer => this.set(reducer(this.get()))));
        } else {
            this.set(reducer(this.get()));
        }
    }
}
