import {Component, HyperComponent, property} from "@hypertype/ui";
import {IEvents, IState, Template} from "./mobile-toolbar.template";
import {TreeReducers} from "../tree/tree-reducers";
import {Injectable, map, mapTo, Observable, switchMap, tap, withLatestFrom} from "@hypertype/core";

@Injectable(true)
@Component({
    name: 'ctx-mobile-toolbar',
    template: Template,
    style: require('./mobile-toolbar.style.less')
})
export class MobileToolbarComponent extends HyperComponent<IState, IEvents>{

    constructor(private treeStore: TreeReducers) {
        super();
    }

    @property()
    public state$!: Observable<IState>

    public State$ = this.state$;
    public Actions$ = this.Events$.pipe(
        // switchMap(x => this.treeStore[x.type](x.args)),
        withLatestFrom(this.Element$),
        tap(([reducer,element]) => {
            element.dispatchEvent(new CustomEvent("reduce", {
                detail: reducer
            }));
        }),
        mapTo(null)
    )
}
