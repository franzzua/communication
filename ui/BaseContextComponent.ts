import {HyperComponent, property} from "@hypertype/ui";
import {filter, Fn, map, merge, Observable, shareReplay, switchMap, tap} from "@hypertype/core";
import {Context} from "@model";
import {StateService} from "@services";

export abstract class BaseContextComponent<TState = {}, TEvents = any> extends HyperComponent<TState, TEvents> {

    protected constructor(protected stateService: StateService) {
        super();
    }

    @property()
    private uri$!: Observable<string>;

    @property()
    private context$!: Observable<Context>;

    private contextURI$ = this.context$.pipe(
        filter(Fn.Ib),
        map(c => c.id),
        filter(Fn.Ib),
        // tap(console.log),
    );
}
