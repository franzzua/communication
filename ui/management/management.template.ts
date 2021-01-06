import {IEventHandler, wire} from "@hypertype/ui";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    <ctx-tree context=${state}></ctx-tree>
`;

export interface IState {

}

export interface IEvents {

}
    