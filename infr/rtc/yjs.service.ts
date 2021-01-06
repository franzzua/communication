import {Injectable} from "@hypertype/core";
import {EventBus} from "@services";
import {YjsRepository} from "@infr/rtc/yjsRepository";

@Injectable()
export class YjsService {

    constructor(private eventBus: EventBus,
                private repository: YjsRepository) {
    }

    public Actions$ = this.eventBus.Subscribe(this.repository);
}

