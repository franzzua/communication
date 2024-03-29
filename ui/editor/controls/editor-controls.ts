import {component, HtmlComponent, property } from "@cmmn/ui";
import type {EditorItem} from "../types";
import style from "./editor-controls.style.less";
import { template, IState, IEvents } from "./editor-controls.template";
import {Injectable} from "@cmmn/core";
import {measureTest} from "./text-measure";
import {DomainProxy} from "@proxy";

@Injectable(true)
@component({name: 'editor-controls', template, style})
export class EditorControls extends HtmlComponent<IState, IEvents>{

    constructor(private rootProxy: DomainProxy) {
        super();
    }


    @property()
    public item: EditorItem;

    @property()
    public text: string;

    getSizeInfo(){
        const text = this.item.Message.State?.Content ?? '';
        const style = getComputedStyle(this.element);
        const size = measureTest(text, style.fontFamily.split(',')[0], style.fontWeight, parseFloat(style.fontSize));
        return {
            Top: size.fontAscent -size.actualAscent,
            SmallLetterTop: size.fontAscent - size.letterHeight + size.lineGapTop,
            Baseline: size.lineHeight - size.fontDescent - size.lineGapBottom,
            Down: size.lineHeight - size.fontDescent+ size.actualDescent - size.lineGapBottom,
            Height: size.lineHeight,
            Width: size.width
        }
    }

    get Connections(){
        return Array.from(this.rootProxy.State.Networks.get(this.item.State.ContextURI)?.values() ?? [])
    }

    get State(){
        return {
            Size: this.getSizeInfo(),
            Text: this.Connections.map(x => x.username).join(' ')
        };
    }
}