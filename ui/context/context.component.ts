import {Component, HyperComponent, property} from "@hypertype/ui";
import {combineLatest, filter, first, Fn, Injectable, map, merge, Observable, switchMap, tap,} from "@hypertype/core";
import {Context, Message} from "@model";
import {StateService} from "@services";
import {BaseContextComponent} from "../BaseContextComponent";

@Injectable(true)
@Component({
    name: 'ctx-context',
    template: (html, state: IState, events) => {
        return html`
            <div class="header">${state.context.URI}</div>
            <div class="body">
                <div class="children">
                    ${state.context.Messages.map((msg, index) => html(`msg.${index}`)`
                        <ctx-message message=${msg}></ctx-message>
                    `)}
                </div>
                <ctx-message message=${state.addMessage} active=${true}
                             onchange=${events.addMessage((e: CustomEvent) => e.detail)}></ctx-message>
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
            isSelected: false,
            addMessage: {
                Context: context,
                Content: '',
                Action: 'add.message'
            }
        })),
        tap(console.log),
        filter(Fn.Ib),
    );

    public Events = {
        addMessage:  async (text) => {
            await this.stateService.AddMessage({
                Context: await this.Context$.pipe(first()).toPromise(),
                Content: text,
                id: `message.${Id()}`,
                URI: undefined,
                Order: 0
            })
        }
    };
}

interface IState {
    context: Context;
    isSelected: boolean;
    addMessage: Message;
}

export function arrayEqual(arr1: any[], arr2: any[]) {
    return arr1 && arr2 && arr1.length === arr2.length
        && arr1.every((x, i) => x === arr2[i])
}
export const Id: () => number = (() => { let id = 1; return () => id++; })();
