import {Storage} from "@model";
import {BehaviorSubject, Injectable, Observable} from "@hypertype/core";
import {ContextService} from "./context.service";
import {EventBus} from "./event.bus";
import {LogService} from "./log.service";

@Injectable()
export class StorageService {

    constructor(private contextService: ContextService,
                private eventBus: EventBus) {
    }

    public async Create(storage: Storage): Promise<Storage> {
        const result = new Storage();
        result.Root = await this.contextService.Create(result);
        return result;
    }

    private _storageSubject$ = new BehaviorSubject<Storage[]>([]);
    public Storages$: Observable<Storage[]> = this._storageSubject$.asObservable();

    async AddStorage(storage: Storage){
        // this.logService.Info({
        //     Domain: 'Storage',
        //     Phase: 'Add',
        // })
        this._storageSubject$.next([...this._storageSubject$.value, storage]);
    }
}