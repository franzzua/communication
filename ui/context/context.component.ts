import {Component, HyperComponent, property} from "@hypertype/ui";
import {combineLatest, filter, Fn, Injectable, map, Observable, switchMap, tap,} from "@hypertype/core";
import {Context} from "@model";
import {ContextStore} from "../../stores/context/context.store";

@Injectable(true)
@Component({
    name: 'ctx-context',
    template: (html, state: IState, events) => {
        return html`
            <div class="children">
                ${state.context.Messages.map((msg, index) => html(`msg.${index}`)`
                    <ctx-message message=${msg}></ctx-message>
                `)}
            </div>
        `
    },
    style: require('./context.style.less')
})
export class ContextComponent extends HyperComponent<IState> {

    constructor(private store: ContextStore) {
        super();
    }

    @property()
    public uri$: Observable<string>;

    private context$: Observable<Context> = this.uri$.pipe(
        switchMap(x => this.store.getContext$(x)),
        filter(Fn.Ib),
    );

    public State$ = combineLatest([
        this.context$
    ]).pipe(
        map(([context]) => ({
            context,
            isSelected: false
        })),
        filter(Fn.Ib)
    );
}

interface IState {
    context: Context;
    isSelected: boolean;
}

export function arrayEqual(arr1: any[], arr2: any[]) {
    return arr1 && arr2 && arr1.length === arr2.length
        && arr1.every((x, i) => x === arr2[i])
}