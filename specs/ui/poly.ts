import {Event} from "linkedom";
import {Cell} from "@cmmn/cell";

export class IntersectionObserver {

}
export class KeyboardEvent extends Event{
    constructor(name, {
        bubbles,
        composed,
        cancelable,
        ...options
    }: KeyboardEventInit) {
        super(name, {
            bubbles,
            composed,
            cancelable,
        } as EventInit);
        Object.assign(this, options);
    }

}

let selection: Selection = null;

export const Poly = {
    IntersectionObserver,
    KeyboardEvent,
    getSelection: () => selection,
    setSelection: (value: Selection) => {
        selection = value;
        document.dispatchEvent(new Event('selectionchange') as any)
    },
    requestAnimationFrame: (handler) => {
        Promise.resolve().then(handler)
    }
}