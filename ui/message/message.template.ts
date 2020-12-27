import {IEventHandler} from "@hypertype/ui";
import {Message} from "@model";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => {
    // if (state.path.indexOf(state.context.Id) < state.path.length - 1)
    //     return html`[[circular]]`;
    // if (!state.context)
    //     return html``;
    // const context = state.context;
    // const isEmpty = state.state.includes('empty');
    // const isCollapsed = state.state.includes('collapsed');
    return html`
            <div class="${`context-inner ${state.state.join(' ')}`}">
                <div class="body">
                    <ctx-text-content msg=${state.message} active=${state.isSelected} />
                    <span class="arrow"></span>
                </div>
                ${state.message.SubContext ? html('context')`
                    <ctx-context uri=${state.message.SubContext.URI}></ctx-context> 
                ` : ''}
            </div>
    `;
}

export interface IState {
    message: Message;
    state: string[];
    isSelected: boolean;
}

export interface IEvents {

}
    