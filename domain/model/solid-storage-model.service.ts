import {Injectable} from "@hypertype/core";
import {StorageModel} from "@domain/model/storage-model";
import {IFactory} from "@domain/model/i-factory";
import {LocalRepository} from "@infr/local/local.repository";
import {SolidRepository} from "@infr/solid";
import {BackgroundRepository} from "@infr/background.repository";

@Injectable(true)
export class SolidStorageModel extends StorageModel {

    constructor(factory: IFactory,
                private localRepository: LocalRepository,
                private solidRepository: SolidRepository) {
        super(factory, new BackgroundRepository(solidRepository, localRepository));
        // this.solidRepository.IsBack = true;
    }

    // public async Load(): Promise<void> {
    //     const json = await this.localRepository.Init(this.ToJSON());
    //     await this.Init(json);
    //     this.solidRepository.Init(this.ToJSON())
    //         .then(x => this.Init(x))
    //         .then(x => this.Update())
    //         .catch(err => console.error(err));
    // }
}
