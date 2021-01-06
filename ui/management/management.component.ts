import {Injectable} from "@hypertype/core";
import {Component, HyperComponent} from "@hypertype/ui";
import {IEvents, IState, Template} from "./management.template";
import {ManagementService} from "../../services/management.service";

@Injectable(true)
@Component({
    name: 'ctx-management',
    template: Template,
    style: require('./management.style.less')
})
export class ManagementComponent extends HyperComponent<IState, IEvents> {


    constructor(private managementService: ManagementService) {
        super();
    }

    public State$ = this.managementService.State$;
}
    