import {Injectable} from "@hypertype/core";
import {DomainEventHandler, EventBus} from "@services";
import {ISession, useSession} from "solidocity";
import {SolidRepository} from "@infr/solid/solid.repository";

@Injectable()
export class SolidService {


    private repository = new SolidRepository();

    constructor(private eventBus: EventBus) {

    }

    public async Init(session: ISession) {
        await useSession(session);
        const subscription = this.Actions$.subscribe();
        const collection = await this.repository.Load(session);

    }

    private Handler: DomainEventHandler = {
        AttachContext: event => this.repository.AttachContext(event.Message, event.Context),
        AddMessage: event => this.repository.AddMessage(event.Message),
        CreateContext: event => this.repository.CreateContext(event.Context)
    }

    public Actions$ = this.eventBus.Subscribe(this.Handler);
}