import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./communication.template";

@Component({
    name: 'ctx-communication',
    template: Template,
    style: require('./communication.style.less')
})
export class CommunicationComponent extends HyperComponent<IState, IEvents>{

}
    