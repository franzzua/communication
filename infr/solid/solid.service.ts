import {Injectable} from "@hypertype/core";
import {DomainEventHandler, EventBus} from "@services";
import {SolidRepository} from "@infr/solid/solid.repository";

@Injectable()
export class SolidService {


    constructor(private eventBus: EventBus,
                private repository: SolidRepository) {
    }

    public Actions$ = this.eventBus.Subscribe(this.repository);
}