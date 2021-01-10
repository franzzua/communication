import {IState} from "./tree.template";
import {KeyboardAspect} from "./keyboardAspect";
import {TreeComponent} from "./tree.component";
import {ActionService, EventBus, StateService} from "@services";
import {Injectable, utc} from "@hypertype/core";
import {Context, Message} from "@model";

@Injectable()
export class TreeKeyboardAspect extends KeyboardAspect<TreeComponent> {

    constructor(private actionService: ActionService,
                private eventBus: EventBus) {
        super();
    }

    async Enter(event: KeyboardEvent, state: IState) : Promise<IState>{
        const message = state.Items[state.SelectedIndex].Message;
        if (message.Action != null) {
            this.actionService.Invoke(message.Action, message);
            return state;
        }
        if (message.SubContext == null){
            const newContext = {
                id: `${+utc()}`,
                Messages: [],
                Storage: message.Context.Storage,
            } as Context;
            this.eventBus.Notificator.OnCreateContext(newContext);
            this.eventBus.Notificator.OnAttachContext(newContext.id, message);
            message.SubContext = newContext;
        }
        if (message.SubContext != null){
            const newMessage = {
                Content: '',
                Context: message.SubContext,
                CreatedAt: utc(),
            };
            this.eventBus.Notificator.OnAddMessage(newMessage);
            return {
                SelectedIndex: state.SelectedIndex + message.SubContext.Messages.length + 1,
                Items: [
                    ...state.Items.slice(0, state.SelectedIndex + 1),
                    {Message: newMessage, Level: state.Items[state.SelectedIndex].Level},
                    ...state.Items.slice(state.SelectedIndex + 1)
                ]
            };

        }
        return state;
    }

    async ArrowDown(event: KeyboardEvent, state: IState) : Promise<IState>{
        return {
            ...state,
            SelectedIndex: state.SelectedIndex + 1
        };
    }

    async ArrowUp(event: KeyboardEvent, state: IState) : Promise<IState>{
        return {
            ...state,
            SelectedIndex: state.SelectedIndex - 1
        };
    }

    async ShiftDelete(event: KeyboardEvent, state: IState): Promise<IState> {
        const message = state.Items[state.SelectedIndex].Message;
        this.eventBus.Notificator.OnDeleteMessage(message);
        return {
            Items: [
                ...state.Items.slice(0, state.SelectedIndex),
                ...state.Items.slice(state.SelectedIndex + 1),
            ],
            SelectedIndex: state.SelectedIndex
        }
    }
}

