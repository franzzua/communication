import {GlobalStaticState} from "./component";
import {IEvents} from "./types";

export abstract class HtmlComponent<TState, TEvents extends IEvents = {}> extends HTMLElement {
    Events: TEvents;

    abstract get State(): TState;

    Actions: Function[] = [];
}

const HtmlComponentImpl = function () {
    const element = GlobalStaticState.creatingElement;
    // @ts-ignore
    this.__proto__.__proto__ = element.__proto__;
    // @ts-ignore
    element.__proto__ = this.__proto__;
    this.Events = this;
    this.Actions = [];
    Object.assign(element, this);
    return element;
}

// @ts-ignore
HtmlComponent = HtmlComponentImpl as any;