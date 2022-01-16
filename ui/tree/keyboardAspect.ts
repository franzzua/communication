import {EventEmitter} from "cellx";

export class KeyboardAspect extends EventEmitter {

    constructor(private element: HTMLElement) {
        super();
        element.addEventListener('keydown', event => {
            if (event.target instanceof HTMLInputElement)
                return;
            const modifiers = ['Alt', 'Ctrl', 'Shift'].filter(x => event[x.toLowerCase() + 'Key']);
            const modKey = modifiers.join('') + event.code;
            this._eventsQueue.push({event, modKey});
            this.emit('change');
        })
        element.addEventListener('copy', event => {
            this._eventsQueue.push({event, modKey: 'Copy'});
            this.emit('change');
        })
        element.addEventListener('paste', event => {
            this._eventsQueue.push({event, modKey: 'Paste'});
            this.emit('change');
        })
        navigator.clipboard.addEventListener('paste', event => {
            this._eventsQueue.push({event, modKey: 'Paste'});
            this.emit('change');
        })

    }

    private _eventsQueue = [];

    public get EventQueue() {
        const res = this._eventsQueue.slice();
        this._eventsQueue.length = 0;
        return res;
    }

}
