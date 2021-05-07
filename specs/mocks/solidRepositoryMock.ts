import {SolidRepository} from "@infr/solid";
import {Context, Message} from "@model";
import {StateService, StorageService} from "@services";
import {Injectable} from "@hypertype/core";

@Injectable()
export class SolidRepositoryMock extends SolidRepository {

    public static instances: SolidRepositoryMock[] = [];

    constructor() {
        super();
        SolidRepositoryMock.instances.push(this);
    }


    public async CreateDefaultStorage(session) {
        return null;
    }

}
