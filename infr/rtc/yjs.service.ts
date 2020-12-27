import {Injectable} from "@hypertype/core";
import {DomainEventHandler, EventBus} from "@services";
import {YjsRepository} from "@infr/rtc/yjsRepository";

@Injectable()
export class YjsService{

    private repository: YjsRepository;

    constructor(private eventBus: EventBus) {
        this.repository = new YjsRepository((type, data)=> {
            this.eventBus.Notify(type, {
                ...data,
                source: this
            })
        });
    }


    private Handler: DomainEventHandler = {
        AttachContext: event => this.repository.AttachContext(event.Message, event.Context),
        AddMessage: event => this.repository.AddMessage(event.Message),
        UpdateContent: event => this.repository.UpdateContent(event.Message, event.Content),
        CreateContext: event => this.repository.CreateContext(event.Context)
    }

    public Actions$ = this.eventBus.Subscribe(this.Handler, this);
}

