import {IEventHandler} from "@hypertype/ui";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    This is Storage. ${html('state')`
        <code>${JSON.stringify(state)}</code>
    `}
`;

export interface IState {

}

export interface IEvents {

}
    