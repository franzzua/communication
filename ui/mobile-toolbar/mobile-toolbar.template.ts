import type {TreeReducers} from "../tree/tree-reducers";
import {Icons} from "../../icons/Icons";
import {ITemplate} from "@cmmn/ui";

export const Template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <input onchange=${events.AddNext(e => (e.target.value = '') || e)}>
    ${Icons.move.left(html, {}, [], {click: events.MoveLeft(x => x)})}
    ${Icons.plus.message(html, {}, [], {click: events.AddNext(x => x)})}
    ${Icons.plus.list(html, {}, [], {click: events.AddChild(x => x)})}
    ${Icons.move.right(html, {}, [], {click: events.MoveRight(x => x)})}
`;

export interface IState {

}

export type IEvents = {
    [action in keyof TreeReducers]: (event: Event) => void;
}
