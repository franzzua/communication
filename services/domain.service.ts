import {Injectable, merge} from "@hypertype/core";
import {StateService} from "./state.service";
import {YjsService} from "@infr/rtc";
import {SolidService} from "@infr/solid";

@Injectable()
export class DomainService{
    constructor(
        private stateService: StateService,
        private yjsService: YjsService,
        private solidService: SolidService
    ) {
    }



    public Actions$ = merge(
        this.yjsService.Actions$,
        this.solidService.Actions$
    );
}