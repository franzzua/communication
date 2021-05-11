import * as h from "@hypertype/core";
import {Injectable} from "@hypertype/core";
import {Storage, Context, Sorting} from "@model";
import {EventBus} from "./event.bus";

@Injectable()
export class ContextService {

    constructor(private eventBus: EventBus) {

    }

    public async Create(Storage: Storage): Promise<Context> {
        return new Context();
    }

    private Contexts: Map<string, Context> = new Map<string, Context>([
        ['root', {URI: 'http://localhost/root', Messages: [
                {Content: '1'},
                {Content: '2'},
                {Content: '3'},
                {Content: '4'},
            ], Sorting: Sorting.Alphabetically} as any]
    ]);

    public Get$(id){
        return h.of(this.Contexts.get(id));
    }

    public async Detach() {

    }

}
