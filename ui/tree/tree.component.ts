import {component, HtmlComponent, property} from "@cmmn/ui";
import {IEvents, IState, Template} from "./tree.template";
import {ContextProxy, DomainProxy} from "@services";
import {keyMap, TreeReducers} from "./tree-reducers";
import {TreeItem} from "../../presentors/tree.presentor";
import {RouterService} from "../../app/services/router.service";
import {Cell, AsyncQueue, Fn, Injectable, bind} from "@cmmn/core";
import {KeyboardAspect} from "./keyboardAspect";
import {Context} from "@model";

@Injectable(true)
@component({
    name: 'ctx-tree',
    template: Template,
    style: require('./tree.style.less')
})
export class TreeComponent extends HtmlComponent<Pick<IState, "Items" | "Selected">, IEvents> implements IEvents {


    constructor(private root: DomainProxy,
                private routerService: RouterService,
                private treeStore: TreeReducers) {
        super();
    }

    private keyboard = new Cell(new KeyboardAspect(this));
    @property()
    private uri!: string;

    @Fn.distinctUntilChanged<ContextProxy>((a, b) => a && b && Context.equals(a.State, b.State))
    get ContextProxy(): ContextProxy {
        return this.uri && this.root.ContextsMap.get(this.uri);
    }

    public $reducerState = new ReducerQueueState({
        Items: [],
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

    reduce(reducer: Reducer<IState>) {
        this.$reducerState.Invoke(reducer);
    }

    @bind
    private InitAction() {
        const context = this.ContextProxy;
        if (context)
            this.$reducerState.Invoke(this.treeStore.Init(context));
    }

    @bind
    private KeyboardActions() {
        const eventQueue = this.keyboard.get().EventQueue;
        eventQueue.forEach(({event, modKey}: { event: KeyboardEvent, modKey: string }) => {
            if (modKey in keyMap) {
                event.preventDefault();
                const reducer = this.treeStore[keyMap[modKey]](event as any);
                this.$reducerState.Invoke(reducer);
            }
        })
    }

    get State(){
        const s = this.$reducerState.get();
        return {
            Items: s.Items,
            Selected: s.Selected
        }
    }



    public Actions = [this.InitAction, this.KeyboardActions];
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
