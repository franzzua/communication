import {HyperComponent} from "@hypertype/ui";
import * as h from "@hypertype/core";
import {Observable} from "@hypertype/core";

export class KeyboardAspect<TComponent extends HyperComponent = HyperComponent> {

    public ApplyAspect$(state$: TComponent["State$"],
                        element$: Observable<HTMLElement>) {
        const keyboardEvents$ = element$.pipe(
            h.switchMap(element => h.fromEvent(element, 'keydown')),
            h.mergeMap(async (event: KeyboardEvent) => {

                const modifiers = ['Alt', 'Ctrl', 'Shift'].filter(x => event[x.toLowerCase() + 'Key']);
                const modKey = modifiers.join('') + event.key;
                if (this[modKey])
                    event.preventDefault();
                const state = await result$.pipe(h.first()).toPromise();
                if (!this[modKey])
                    return state;
                return await this[modKey](event, state);
            })
        )
        const result$ = h.merge(
            state$,
            keyboardEvents$
        );
        return result$;
    }

}
