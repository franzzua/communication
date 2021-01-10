import {SolidRepository} from "@infr/solid";
import {Context, Message} from "@model";
import {StateService, StorageService} from "@services";
import {Injectable} from "@hypertype/core";

@Injectable()
export class SolidRepositoryMock extends SolidRepository {

    public static instances: SolidRepositoryMock[] = [];

    constructor(stateService: StateService,
                storageService: StorageService) {
        super(stateService, storageService);
        SolidRepositoryMock.instances.push(this);
    }


    public async CreateDefaultStorage(session) {
        return null;
    }

    async OnAttachContext(contextURI: string, message: Message) {
    }

    async OnAddMessage(message: Message) {
        return message;
    }

    async OnUpdateContent(message: Message, content: any){

    }

    async OnCreateContext(context: Context) {
        SolidRepositoryMock.instances
            .filter(x => x != this)
            .forEach(x => x.onNewContext({
                URI: context.URI,
                Messages: []
            }));
        return context;
    }
}