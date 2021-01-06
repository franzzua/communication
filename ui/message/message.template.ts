import {IEventHandler} from "@hypertype/ui";
import {Message} from "@model";


export const Template = (html, state: IState, events: IEventHandler<IEvents>) => {
    const keyboardAction = (e: KeyboardEvent) =>
        e.altKey || e.ctrlKey || e.shiftKey ||
            e.key.toLowerCase() != 'enter' ||
            e;

    // if (state.path.indexOf(state.context.Id) < state.path.length - 1)
    //     return html`[[circular]]`;
    // if (!state.context)
    //     return html``;
    // const context = state.context;
    // const isEmpty = state.state.includes('empty');
    // const isCollapsed = state.state.includes('collapsed');
    return html`
            <div class="${`context-inner ${state.state.join(' ')}`}">
                <div class="body" onkeydown=${events.action(e => e)}>
                    <ctx-text-content message=${state.message} active=${state.isSelected} />
                </div>
                ${state.message.SubContext ? html('context')`
                    <span class="arrow"></span>
                    <ctx-context context=${state.message.SubContext}></ctx-context> 
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
    action(e: Event);
}
    