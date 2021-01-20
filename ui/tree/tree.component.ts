import {Component} from "@hypertype/ui";
import {IEvents, IState, Template} from "./tree.template";
import {BaseContextComponent} from "../BaseContextComponent";
import {StateService} from "@services";
import * as h from "@hypertype/core";
import {Injectable, map, Observable} from "@hypertype/core";
import {Context, Message} from "@model";
import {TreeKeyboardReducer} from "./tree.keyboard.reducer";
import {KeyboardAspect} from "./keyboardAspect";
import {TreeItem, TreePresenter} from "../../presentors/tree.presentor";

@Injectable(true)
@Component({
    name: 'ctx-tree',
    template: Template,
    style: require('./tree.style.less')
})
export class TreeComponent extends BaseContextComponent<IState, IEvents> {

    constructor(stateService: StateService,
                private keyboardReducer: TreeKeyboardReducer) {
        super(stateService);
    }

    protected transforms$ = h.merge(
        this.Events$.pipe(
            h.filter(x => x.type == "focus"),
            h.map(x => x.args.item as TreeItem),
            h.map(x => ((state: IState) => {
                console.log('focus', x);
                return ({...state, Selected: x});
            }) as Transform<IState>)
        ),
        KeyboardAspect.GetEvents$(this.Element$).pipe(
            h.filter(x => x.modKey in this.keyboardReducer),
            h.tap(x => x.event.preventDefault()),
            h.map(x => async state => {
                console.log('keyboard', x.modKey);
                return await this.keyboardReducer[x.modKey](x.event, state);
            })
        ),
        this.Context$.pipe(
            map(root => state => {
                const itemsMap = state?.ItemsMap ?? new Map<string, TreeItem>();
                const items = TreePresenter.ToTree(root, itemsMap);
                const newState = ({
                    ...state,
                    Root: root,
                    Selected: state?.Selected ?? items[0],
                    ItemsMap: itemsMap,
                    Items: items
                });
                console.log('state', newState);
                return newState;
            })
        ),
    );

    public State$: Observable<IState> = this.transforms$.pipe(
        h.concatMap(async (transform) => {
            // this.transforms$.pipe(
            //     h.withLatestFrom(this.State$),
            //     h.concatMap(async ([transform, state]) =>
            //     {
            const state = await this.State$.pipe(h.first()).toPromise();
            const newState = await transform(state);
            return newState;
        }),
                // }),
            // ) as Observable<IState>),
        // h.tap(x => console.log(x.Selected.Message.id.split('#').pop())),
        h.startWith(null as IState),
        h.shareReplay(1),
    )

}

export type TransformResult<T> = T | Promise<T>;
export type Transform<T> = (t: T) => TransformResult<T>;
