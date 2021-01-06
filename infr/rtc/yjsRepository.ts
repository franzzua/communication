import {Doc} from "yjs";
import {Context, Message} from "@model";
import {DomainEventsListener, EventBus, LogService, StateService} from "@services";
import {WebrtcProvider} from "y-webrtc";
import {Injectable} from "@hypertype/core";
import {ContextSync} from "./context.sync";

@Injectable()
export class YjsRepository implements DomainEventsListener {
    private ObserverMap = new Map<string, ContextSync>();
    private notify: DomainEventsListener;

    constructor(protected eventBus: EventBus,
                protected logService: LogService,
                protected stateService: StateService) {
        this.notify = eventBus.getNotificator(this);
    }


    private Listen(contextURI: string) {
        const observer = new ContextSync(contextURI);
        // this.Connect(contextURI, observer.Doc);
        this.ObserverMap.set(contextURI, observer);
        console.log('listen', contextURI);
        return observer;
    }


    async OnAttachContext(context: Context, to: Message) {
    }

    async OnAddMessage(message: Message) {
        this.logService.Info({Domain: 'yjs', Phase: 'add-message'});
        const observer = this.ObserverMap.get(message.Context.URI) ?? this.Listen(message.Context.URI);
        observer.Load(message.Context);
        await observer.AddMessage(message);
    }

    async OnCreateContext(context: Context) {
        const observer = this.ObserverMap.get(context.URI) ?? this.Listen(context.URI);
        await observer.AddContext(context);
    }

    async OnUpdateContent(message: Message, content) {
        const observer = this.ObserverMap.get(message.Context.URI) ?? this.Listen(message.Context.URI);
        observer.Load(message.Context);
        await observer.UpdateContent(message, content);
    }

    async OnContextChanged(contextURI) {
        const observer = this.ObserverMap.get(contextURI) ?? this.Listen(contextURI);
    }
}