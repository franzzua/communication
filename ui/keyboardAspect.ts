import {EventEmitter} from "@cmmn/core";

export class KeyboardAspect extends EventEmitter<{
    event: {event: Event, modKey: string}
}> {

    constructor(private element: HTMLElement) {
        super();
        element.addEventListener('keydown', event => {
            const modifiers = ['Alt', 'Ctrl', 'Shift'].filter(x => event[x.toLowerCase() + 'Key']);
            const modKey = modifiers.join('') + event.code;
            this.emit('event', {event, modKey} );
        })
        element.addEventListener('copy', event => {
            this.emit('event', {event, modKey: 'Copy'} );
        })
        element.addEventListener('paste', event => {
            this.emit('event', {event, modKey: 'Paste'} );
        })
        navigator.clipboard.addEventListener('paste', event => {
            this.emit('event', {event, modKey: 'Paste'} );
        })

    }


}
