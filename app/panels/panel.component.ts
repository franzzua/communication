import {IEvents, IState, Template} from "./panel.template";
import {component, HtmlComponent} from "@cmmn/ui";
import style from "./panel.style.less";

@component({
    name: 'ctx-panel',
    template: Template,
    style
})
export class PanelComponent extends HtmlComponent<IState, IEvents>{


}
