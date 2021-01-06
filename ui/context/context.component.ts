import {Component, HyperComponent, property} from "@hypertype/ui";
import {combineLatest, filter, Fn, Injectable, map, merge, Observable, switchMap, tap,} from "@hypertype/core";
import {Context} from "@model";
import {StateService} from "@services";
import {BaseContextComponent} from "../BaseContextComponent";

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
export class ContextComponent extends BaseContextComponent<IState> {

    constructor(state: StateService) {
        super(state);
    }

    public State$ = combineLatest([this.Context$]).pipe(
        map(([context]) => ({
            context,
            isSelected: false
        })),
        tap(console.log),
        filter(Fn.Ib),
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