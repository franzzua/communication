import * as h from "@hypertype/core";
import {Router} from "@hypertype/app";
import {EventBus} from "@services";

@h.Injectable()
export class RouterService {
    constructor(private eventBus: EventBus,
                private router: Router) {
    }

    private Navigate$ = this.eventBus.EventStream$.pipe(

    )

    public Actions$ = h.combineLatest([
        this.router.State$,
        this.Navigate$
    ]).pipe(

    );
}