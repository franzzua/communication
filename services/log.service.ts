import {Injectable} from "@hypertype/core";
import {Logger, LogLevel} from "@hypertype/infr";

let instanceCounter = 0;

@Injectable()
export class LogService {

    private Instance = instanceCounter++;

    constructor() {

    }

    public Info(data){
        Logger.Default.Log({
            ...data,
            Instance: this.Instance,
            Level: LogLevel.Info
        } as any);
    }

}