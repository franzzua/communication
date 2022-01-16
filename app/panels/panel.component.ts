import {IEvents, IState, Template} from "./panel.template";
import {component, HtmlComponent} from "@common/ui";

@component({
    name: 'ctx-panel',
    template: Template,
    style: require('./panel.style.less')
})
export class PanelComponent extends HtmlComponent<IState, IEvents>{


}
