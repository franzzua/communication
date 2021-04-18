import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./panel.template";
import * as h from "@hypertype/core";

@Component({
    name: 'ctx-panel',
    template: Template,
    style: require('./panel.style.less')
})
export class PanelComponent extends HyperComponent<IState, IEvents>{


    private isOpen = false;

    private IsOpen$ =this.Events$.pipe(
        h.filter(x => x.type == "switchOpen"),
        h.map(x => this.isOpen = !this.isOpen),
        h.startWith(this.isOpen),
    )

    public State$ = h.combineLatest([
        this.IsOpen$
    ]).pipe(
        h.map(([isOpen]) => ({
            isOpen
        }))
    )
}
