import {component, HtmlComponent, property} from "@common/ui";
import {IEvents, IState, Template} from "./tree.template";
import {StateService} from "@services";
import {keyMap, TreeReducers} from "./tree-reducers";
import {TreeItem} from "../../presentors/tree.presentor";
import {RouterService} from "../../app/services/router.service";
import {AsyncQueue, Fn, Injectable} from "@common/core";
import {Cell, cellx} from "cellx";
import {KeyboardAspect} from "./keyboardAspect";
import {Context} from "@model";
import bind from "bind-decorator";

@Injectable(true)
@component({
    name: 'ctx-tree',
    template: Template,
    style: require('./tree.style.less')
})
export class TreeComponent extends HtmlComponent<IState, IEvents> implements IEvents {


    constructor(private stateService: StateService,
                private routerService: RouterService,
                private treeStore: TreeReducers) {
        super();
    }

    private keyboard = new Cell(new KeyboardAspect(this));
    @property()
    private uri!: string;

    // @distinctUntilChanged<Model<Context>>((a, b) => a.State?.URI === b.State?.URI)
    get ContextModel() {
        return this.stateService.getContext(this.uri);
    }

    @Fn.distinctUntilChanged(Context.equals)
    get Context() {
        return this.ContextModel?.State;
    }

    public $state = new ReducerQueueState({
        Items: [],
        Root: null,
        Selected: null,
        ItemsMap: new Map<string, TreeItem>()
    });

    async setFocus({item, index}: { item: TreeItem; index: number; }) {
        this.$state.Invoke(this.treeStore.Focus(item));
    }

    updateMessage(x: { item: any; content: any; }) {
        this.$state.Invoke(this.treeStore.UpdateContent(x));
    }

    addMessage(text: string) {
        throw new Error("Method not implemented.");
    }

    reduce(reducer: Reducer<IState>) {
        this.$state.Invoke(reducer);
    }

    @bind
    private InitAction() {
        this.Context && this.$state.Invoke(this.treeStore.Init(this.Context))
    }

    @bind
    private KeyboardActions() {
        const eventQueue = this.keyboard.get().EventQueue;
        eventQueue.forEach(({event, modKey}: { event: KeyboardEvent, modKey: string }) => {
            if (modKey in keyMap) {
                event.preventDefault();
                const reducer = this.treeStore[keyMap[modKey]](event as any);
                this.$state.Invoke(reducer);
            }
        })
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
