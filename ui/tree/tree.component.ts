import {Component} from "@hypertype/ui";
import {IEvents, IState, Item, Template} from "./tree.template";
import {BaseContextComponent} from "../BaseContextComponent";
import {StateService} from "@services";
import * as h from "@hypertype/core";
import {Injectable, Observable} from "@hypertype/core";
import {Context} from "@model";
import {TreeKeyboardAspect} from "./treeKeyboardAspect";

@Injectable(true)
@Component({
    name: 'ctx-tree',
    template: Template,
    style: require('./tree.style.less')
})
export class TreeComponent extends BaseContextComponent<IState, IEvents> {

    constructor(stateService: StateService,
                private keyboardAspect: TreeKeyboardAspect) {
        super(stateService);
    }

    private Items$ = this.Context$.pipe(
        h.map(context => this.flatMap(context))
    );

    private flatMap(context: Context, level = 0): Item[] {
        if (!context)
            return [];
        const result = context.Messages.flatMap(msg => ([
            {Message: {...msg}, Level: level},
            ...this.flatMap(msg.SubContext, level + 1)
        ]));
        // console.log('tree', result);
        return result;
    }

    private SelectedIndex$: Observable<number> = this.Events$.pipe(
        h.filter(x => x.type == "focus"),
        h.map(x => x.args.index as number),
        h.startWith(0),
        h.shareReplay(1),
    );

    private state$: Observable<IState> = h.combineLatest([
        this.Items$,
        this.SelectedIndex$
    ]).pipe(
        h.map(([items, index]) => ({
            Items: items,
            SelectedIndex: index
        }))
    );

    public State$ = this.keyboardAspect.ApplyAspect$(this.state$, this.Element$);


}
