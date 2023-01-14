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

const selection = new Cell<Selection>(null);

export const Poly = {
    IntersectionObserver,
    KeyboardEvent,
    getSelection: () => selection.get(),
    setSelection: (value: Selection) => selection.set(value),
    requestAnimationFrame: (handler) => {
        Promise.resolve().then(handler)
    }
}