import {HyperComponent, property} from "@hypertype/ui";
import {filter, Fn, map, merge, Observable, switchMap, tap} from "@hypertype/core";
import {Context} from "@model";
import {StateService} from "@services";

export class BaseContextComponent<TState = {}, TEvents = any> extends HyperComponent<TState, TEvents> {

    constructor(protected stateService: StateService) {
        super();
    }

    @property()
    private uri$!: Observable<string>;

    @property()
    private context$!: Observable<Context>;

    private contextURI$ = this.context$.pipe(
        filter(Fn.Ib),
        map(c => c.URI),
        filter(Fn.Ib),
        tap(console.log),
    );

    private contextByURI$: Observable<Context> = merge(this.uri$, this.contextURI$).pipe(
        filter(Fn.Ib),
        switchMap(x => this.stateService.getContext$(x)),
    );

    protected Context$ = merge(this.contextByURI$, this.context$).pipe(
        filter(Fn.Ib),
    );
}