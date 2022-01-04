import {component, HtmlComponent, property} from "@common/ui";
import {IEvents, IState, Template} from "./tree.template";
import {StateService} from "@services";
import {TreeStore} from "./tree-store.service";
import {TreeItem} from "../../presentors/tree.presentor";
import {RouterService} from "../../app/services/router.service";
import {Injectable} from "@common/core";

@Injectable(true)
@component({
    name: 'ctx-tree',
    template: Template,
    style: require('./tree.style.less')
})
export class TreeComponent extends HtmlComponent<IState, IEvents> implements IEvents{

    constructor(private stateService: StateService,
                private routerService: RouterService,
                private treeStore: TreeStore) {
        super();
    }

    setFocus({ item: Item, index: number }: { item: any; index: any; }) {
        throw new Error("Method not implemented.");
    }

    updateMessage({ item: Item, content: string }: { item: any; content: any; }) {
        throw new Error("Method not implemented.");
    }
    addMessage(text: string) {
        throw new Error("Method not implemented.");
    }
    reduce(reducer: Reducer<IState>) {
        throw new Error("Method not implemented.");
    }
    @property()
    private uri!: string;

    get Context() {
        return this.stateService.getContext(this.uri);
    }

    // public StorageURI$ = this.uri$.pipe(
    //     h.switchMap(uri => this.stateService.LoadStorageForContext(uri)),
    // );
    //
    // public Root$ = this.StorageURI$.pipe(
    //     h.switchMap(uri => this.stateService.getContext$(uri)),
    //     // h.tap(console.log),
    //     h.filter(x => x != null)
    // );
    //
    // protected reducers$: Observable<Reducer<IState>> = h.merge(
    //     this.Events$.pipe(
    //         h.filter(x => x.type == "reduce"),
    //         h.map(x => x.args as Reducer<IState>),
    //     ),
    //     this.Events$.pipe(
    //         h.filter(x => x.type == "focus"),
    //         h.map(x => x.args.item as TreeItem),
    //         h.concatMap(item => this.treeStore.Focus(item) as Promise<Reducer<IState>>)
    //     ),
    //     this.Events$.pipe(
    //         h.filter(x => x.type == "updateMessage"),
    //         h.map(x => x.args as {item: TreeItem, content: string}),
    //         h.concatMap(x => this.treeStore.UpdateContent(x) as Promise<Reducer<IState>>)
    //     ),
    //     KeyboardAspect.GetEvents$(this.Element$).pipe(
    //         h.filter(x => x.modKey in keyMap),
    //         h.tap(x => x.event.preventDefault()),
    //         h.concatMap(x => this.treeStore[keyMap[x.modKey]](x.event as any) as Promise<Reducer<IState>>)
    //     ),
    //     this.Root$.pipe(
    //         h.switchMap(root => this.treeStore.Init(root) as Promise<Reducer<IState>>),
    //     ),
    // );

    private initialState = {
        Items: [],
        Root: null,
        Selected: null,
        ItemsMap: new Map<string, TreeItem>()
    }

    get State() {
        if (!this.Context)
            return this.initialState;
        return this.treeStore.Init(this.Context.State)(this.initialState);
    }

    //
    // public State$: Observable<IState> = this.reducers$.pipe(
    //     h.scan((state, reducer) => reducer(state), {
    //         Items: [],
    //         Root: null,
    //         Selected: null,
    //         ItemsMap: new Map<string, TreeItem>()
    //     } as IState),
    //     // h.tap(x => console.table(x.Items.map(x => ({Message: x.Message.Content, level: x.Path.length})))),
    //     h.shareReplay(1),
    // )


}

// export type TransformResult<T> = T | Promise<T>;
export type Reducer<T> = (t: T) => T;
