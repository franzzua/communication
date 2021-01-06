import {HyperComponent} from "@hypertype/ui";
import * as h from "@hypertype/core";
import {Observable} from "@hypertype/core";

export class KeyboardAspect<TComponent extends HyperComponent = HyperComponent> {

    public ApplyAspect$(state$: TComponent["State$"],
                        element$: Observable<HTMLElement>) {
        const keyboardEvents$ = element$.pipe(
            h.switchMap(element => h.fromEvent(element, 'keydown')),
            h.mergeMap(async (event: KeyboardEvent) => {
                if (this[event.key])
                    event.preventDefault();
                const state = await result$.pipe(h.first()).toPromise();
                if (!this[event.key])
                    return state;
                return await this[event.key](event, state);
            })
        )
        const result$ = h.merge(
            state$,
            keyboardEvents$
        );
        return result$;
    }

}
