import {IEvents, SingleArg} from "./types";
import {HtmlComponent} from "./htmlComponent";
import { Fn, bind } from "@common/core";

export class EventHandlerProvider<TEvents extends IEvents> {
    constructor(private component: HtmlComponent<any, TEvents>) {
    }

    private eventHandlers = {};


    private unsibscribers: Function[] = [];

    @bind
    private addUnsubscriber(unsubscr: Function) {
        this.unsibscribers.push(unsubscr);
    }

    public getEventHandler<TKey extends keyof TEvents = keyof TEvents>(type: TKey) {
        return (mapping: (event: Event) => SingleArg<TEvents[TKey]> = Fn.I as any) => {
            const key = `${type}.${mapping}`;
            if (key in this.eventHandlers)
                return this.eventHandlers[key];
            const listener = event => {
                event.preventDefault();
                const directHandler = this.component.Events && this.component.Events[type];
                if (directHandler)
                    directHandler.call(this.component, mapping(event));
                return false;
            };
            return (this.eventHandlers[key] = [listener, false, this.addUnsubscriber]);
        }
    }

    public Unsubscribe() {
        this.unsibscribers.forEach(f => f());
    }
}