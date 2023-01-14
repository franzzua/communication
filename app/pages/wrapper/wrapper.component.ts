import {component, HtmlComponent, property} from "@cmmn/ui";
import {template, IState, IEvents} from "./wrapper.template";
import style from "./wrapper.style.less";
import {Injectable} from "@cmmn/core";
import {DomainProxy} from "@proxy";

@Injectable(true)
@component({name: 'page-wrapper', template, style})
export class WrapperComponent extends HtmlComponent<IState, IEvents> {

    constructor(private root: DomainProxy) {
        super();
    }

    get State() {
        return {
            Children: this.Children,
            Servers: this.root.State.Servers
        };
    }
}
