import {IEvents, IState, Template} from "./mobile-toolbar.template";
import {TreeReducers} from "../tree/tree-reducers";
import {component, HtmlComponent} from "@cmmn/ui";
import {Injectable} from "@cmmn/core";
import style from "./mobile-toolbar.style.less";

@Injectable(true)
@component({
    name: 'ctx-mobile-toolbar',
    template: Template,
    style
})
export class MobileToolbarComponent extends HtmlComponent<IState, IEvents>{

    constructor(private treeReducers: TreeReducers) {
        super();
    }

    public Events = new Proxy({} as any, {
        get: (target: any, p: keyof TreeReducers, receiver: any): any  => {
            const reducer = this.treeReducers[p].bind(this.treeReducers);
            return target[p] ?? (target[p] = event => {
                this.element.dispatchEvent(new CustomEvent("reduce", {
                    detail: reducer(event)
                }));
            });
        }
    });

    get State(){
        return null;
    }
}
