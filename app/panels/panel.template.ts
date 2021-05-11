import {IEventHandler, wire} from "@hypertype/ui";

const icon = wire(wire,'svg:settings-icon')([require('./settings.icon.html')]);

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    <div class=${`panel ${state.isOpen ? '' : 'closed'}`}>
        <ctx-settings></ctx-settings>
    </div>
    <svg class=${`settings-icon ${state.isOpen ? 'opened': ""}`} 
         viewBox="0 0 16 16"
         onmousedown=${events.switchOpen(x => x)}>
        ${icon}
    </div>
`;

export interface IState {
    isOpen: boolean;
}

export interface IEvents {
    switchOpen();
}
