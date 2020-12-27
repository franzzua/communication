import {Component, HyperComponent, property} from "@hypertype/ui";
import {IEvents, IState, Template} from "./message.template";
import {ObservableStore} from "@hypertype/app";
import {Message} from "@model";
import {Observable, map, Injectable, tap} from "@hypertype/core";

@Injectable(true)
@Component({
    name: 'ctx-message',
    template: Template,
    style: require('./message.style.less')
})
export class MessageComponent extends HyperComponent<IState, IEvents>{

    @property()
    public message$: Observable<Message>

    public State$ = this.message$.pipe(
        tap(console.log),

        map(message => ({
            message,
            state: [],
            isSelected: false
        }))
    );
}
    