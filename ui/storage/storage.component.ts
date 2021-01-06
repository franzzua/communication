import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./storage.template";

@Component({
    name: 'ctx-storage',
    template: Template,
    style: require('./storage.style.less')
})
export class StorageComponent extends HyperComponent<IState, IEvents>{

}
    