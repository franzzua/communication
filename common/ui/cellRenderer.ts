import {Cell, cellx} from "cellx";
import {html, render} from "uhtml";
import bind from "bind-decorator";
import {HtmlComponent} from "./htmlComponent";
import {IEvents, ITemplate} from "./types";
import {Fn} from "@common/core";
import {EventHandlerProvider} from "./eventHandlerProvider";

export class CellRenderer<TState, TEvents extends IEvents> {
    private stateCell = cellx(() => this.component.State);
    private actionsCells = this.component.Actions.map(action => cellx(() => {
        const renderTime = this.renderCell.get();
        action(renderTime);
    }));
    private eventHandler = new EventHandlerProvider(this.component);
    private renderCell = new Cell(Fn.ulid());

    constructor(private component: HtmlComponent<TState, TEvents>,
                private template: ITemplate<TState, TEvents>) {
    }

    private html = (strings: TemplateStringsArray | string, ...args) => {
        if (typeof strings == "string") {
            // case of html('key')`<template>`
            return html.for(this, strings);
        }
        // case of html`<template>`
        if (Array.isArray(strings)) {
            return render(this.component, html(strings, ...args));
        }
        if (!strings) {
            // case of html()`<template>`
            return html.node;
        }
        // case of html(object, 'key')`<template>`
        return html.for(strings, args.join(','));
    }

    handlerProxy = new Proxy({}, {
        get: (target, key) => {
            return this.eventHandler.getEventHandler(key as keyof TEvents);
        }
    });

    @bind
    render() {
        this.template.call(this.component, this.html, this.component.State, this.handlerProxy);
        this.renderCell.set(Fn.ulid());
    }

    Start() {
        this.stateCell.subscribe(this.render);
        for (const c of this.actionsCells) {
            c.subscribe(Fn.I);
        }
        this.render();
    }

    Stop() {
        this.stateCell.unsubscribe(this.render);
        for (const c of this.actionsCells) {
            c.unsubscribe(Fn.I);
        }
    }
}