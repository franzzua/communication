import {Injectable} from "@hypertype/core";
import {LocalRepository} from "@infr/local/local.repository";
import {StorageModel} from "./storage-model";
import {IFactory} from "./i-factory";
import {Sorting} from "@model";

@Injectable(true)
export class LocalStorageModel extends StorageModel {

    constructor(protected factory: IFactory,
                localRepository: LocalRepository) {
        super(factory, localRepository);
    }

}
