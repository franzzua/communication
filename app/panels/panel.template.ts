import {ITemplate} from "@common/ui";

const icon = html => html('svg:settings-icon')([require('./settings.icon.svg')]);

export const Template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <div class=${`panel ${state.isOpen ? '' : 'closed'}`}>
        <ctx-settings></ctx-settings>
    </div>
    <svg class=${`settings-icon ${state.isOpen ? 'opened': ""}`} 
         viewBox="0 0 16 16"
         onmousedown=${events.switchOpen(x => x)}>
        ${icon(html)}
    </div>
`;

export interface IState {
    isOpen: boolean;
}

export type IEvents = {
    switchOpen();
}
