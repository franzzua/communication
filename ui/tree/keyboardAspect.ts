import {HyperComponent} from "@hypertype/ui";
import * as h from "@hypertype/core";
import {Observable} from "@hypertype/core";

export class KeyboardAspect {

    public static GetEvents$<TComponent extends HyperComponent>(element$: Observable<HTMLElement>) {
        return h.merge(
            element$.pipe(
                h.switchMap(element => h.fromEvent<KeyboardEvent>(element, 'keydown')),
                h.filter(event => !(event.target instanceof HTMLInputElement)),
                h.mergeMap(async (event: KeyboardEvent) => {
                    const modifiers = ['Alt', 'Ctrl', 'Shift'].filter(x => event[x.toLowerCase() + 'Key']);
                    const modKey = modifiers.join('') + event.code;
                    return {
                        event, modKey
                    };
                })
            ),
            element$.pipe(
                h.switchMap(element => h.fromEvent(element, 'copy')),
                h.mergeMap(async (event: ClipboardEvent) => {
                    return {
                        event, modKey: 'Copy'
                    };
                })
            ),
            element$.pipe(
                h.switchMap(element => h.fromEvent(element, 'paste')),
                h.mergeMap(async (event: ClipboardEvent) => {
                    return {
                        event, modKey: 'Paste'
                    };
                })
            ),
            h.fromEvent(navigator.clipboard, 'paste').pipe(
                h.mergeMap(async (event: ClipboardEvent) => {
                    return {
                        event, modKey: 'Paste'
                    };
                })
            ),
        )
    }

}
