import {SolidRepository} from "@infr/solid";
import {Context, Message} from "@model";
import {EventBus, StateService, StorageService} from "@services";
import {Injectable} from "@hypertype/core";

@Injectable()
export class SolidRepositoryMock extends SolidRepository {

    public static instances: SolidRepositoryMock[] = [];

    constructor(eventBus: EventBus,
                stateService: StateService,
                storageService: StorageService) {
        super(eventBus, stateService, storageService);
        SolidRepositoryMock.instances.push(this);
    }


    public async CreateDefaultStorage(session) {
        return null;
    }

    async OnAttachContext(message: Message, context: Context) {
    }

    async OnAddMessage(message: Message) {
    }

    async OnCreateContext(context: Context) {
        SolidRepositoryMock.instances
            .forEach(x => x == this || x.onNewContext({
                URI: context.URI,
                Messages: []
            }));
    }
}