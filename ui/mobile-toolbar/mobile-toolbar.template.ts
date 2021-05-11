import {IEventHandler, wire} from "@hypertype/ui";
import type {TreeStore} from "../tree/tree-store.service";
import {Icons} from "../../icons/Icons";

export const Template = (html, state: IState, events: IEventHandler<IEvents>) => html`
    ${Icons.move.left(html, {}, [], {click: events.MoveLeft(x => x)})}
    ${Icons.plus.message(html, {}, [], {click: events.AddNext(x => x)})}
    ${Icons.plus.list(html, {}, [], {click: events.AddChild(x => x)})}
    ${Icons.move.right(html, {}, [], {click: events.MoveRight(x => x)})}
`;

export interface IState {

}

export type IEvents = {
    [action in keyof TreeStore]: (event: Event) => void;
}
