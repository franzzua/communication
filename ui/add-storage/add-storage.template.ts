import {IEventHandler} from "@hypertype/ui";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    <ctx-context context=${state}></ctx-context>
`;

export interface IState {

}

export interface IEvents {
    join(type);
}