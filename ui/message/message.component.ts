import {Component, HyperComponent, property} from "@hypertype/ui";
import {IEvents, IState, Template} from "./message.template";
import {Message} from "@model";
import {Injectable, map, Observable, tap, utc} from "@hypertype/core";
import {ActionService, StateService} from "@services";
import {MessageProxy} from "../../services/message-proxy";

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
    public message$!: Observable<MessageProxy>
    private message: MessageProxy;


    public Events = {
        action: async event => {
            this.message.Context.Actions.CreateMessage({
                Content: '',
                CreatedAt: utc()
            } as Message);
        }
    }

    public State$ = this.message$.pipe(
        // tap(console.log),

        map(message => ({
            message,
            state: [],
            isSelected: true
        }))
    );
}
