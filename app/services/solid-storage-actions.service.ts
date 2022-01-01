import {Injectable} from "@hypertype/core";
import {BaseActions} from "../../services/actions/base.actions";
import {PanelService} from "./panel.service";

@Injectable()
export class SolidStorageActions extends BaseActions {

    constructor(private panelService: PanelService) {
        super();
    }

    protected actions = {
        join: {
            solid: async () => {
                console.log('join solid');
            }
        }
    }
    public Actions = this.flatObject(this.actions, 'Storage');

}