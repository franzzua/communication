import {Component, HyperComponent, property} from "@hypertype/ui";
import {IEvents, IState, Template} from "./tree.template";
import {StateService} from "@services";
import * as h from "@hypertype/core";
import {Injectable, Observable, tap} from "@hypertype/core";
import {keyMap, TreeStore} from "./tree-store.service";
import {KeyboardAspect} from "./keyboardAspect";
import {TreeItem} from "../../presentors/tree.presentor";

@Injectable(true)
@Component({
    name: 'ctx-tree',
    template: Template,
    style: require('./tree.style.less')
})
export class TreeComponent extends HyperComponent<IState, IEvents> {

    constructor(private stateService: StateService,
                private treeStore: TreeStore) {
        super();
    }

    @property()
    private uri$!: Observable<string>;


    public StorageURI$ = this.uri$.pipe(
        h.switchMap(uri => this.stateService.LoadStorage(uri)),
    );

    public Root$ = h.combineLatest([
        this.StorageURI$,
        this.stateService.State$
    ]).pipe(
        h.map(([uri, state])=> state?.Root),
        h.filter(x => x != null)
    );

    protected reducers$: Observable<Reducer<IState>> = h.merge(
        this.Events$.pipe(
            h.filter(x => x.type == "reduce"),
            h.map(x => x.args as Reducer<IState>),
        ),
        this.Events$.pipe(
            h.filter(x => x.type == "focus"),
            h.map(x => x.args.item as TreeItem),
            h.concatMap(item => this.treeStore.Focus(item) as Promise<Reducer<IState>>)
        ),
        this.Events$.pipe(
            h.filter(x => x.type == "updateMessage"),
            h.map(x => x.args as {item: TreeItem, content: string}),
            h.concatMap(x => this.treeStore.UpdateContent(x) as Promise<Reducer<IState>>)
        ),
        KeyboardAspect.GetEvents$(this.Element$).pipe(
            h.filter(x => x.modKey in keyMap),
            h.tap(x => x.event.preventDefault()),
            h.concatMap(x => this.treeStore[keyMap[x.modKey]](x.event as any) as Promise<Reducer<IState>>)
        ),
        this.Root$.pipe(
            h.switchMap(root => this.treeStore.Init(root) as Promise<Reducer<IState>>)
        ),
    );

    public State$: Observable<IState> = this.reducers$.pipe(
        h.scan((state, reducer) => reducer(state), {
            Items: [],
            Root: null,
            Selected: null,
            ItemsMap: new Map<string, TreeItem>()
        } as IState),
        h.tap(x => console.table(x.Items)),
        h.shareReplay(1),
    )


}

// export type TransformResult<T> = T | Promise<T>;
export type Reducer<T> = (t: T) => T;
