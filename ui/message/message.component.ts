import {Component, HyperComponent, property} from "@hypertype/ui";
import {IEvents, IState, Template} from "./message.template";
import {Message} from "@model";
import {Injectable, map, Observable, tap, utc} from "@hypertype/core";
import {ActionService, StateService} from "@services";

@Injectable(true)
@Component({
    name: 'ctx-message',
    template: Template,
    style: require('./message.style.less')
})
export class MessageComponent extends HyperComponent<IState, IEvents> {

    constructor(private actionService: ActionService,
                private stateService: StateService) {
        super();
    }

    @property()
    public message$!: Observable<Message>
    private message: Message;


    public Events = {
        action: async event => {
            if (this.message.Action) {
                this.actionService.Invoke(this.message.Action);
                event.preventDefault();
            } else if (this.message.SubContext) {
                await this.stateService.AddMessage({
                    Context: this.message.SubContext,
                    Content: '',
                    CreatedAt: utc()
                } as Message)
            }
        }
    }

    public State$ = this.message$.pipe(
        tap(console.log),

        map(message => ({
            message,
            state: [],
            isSelected: true
        }))
    );
}
