import {parseHTML} from "linkedom";
import str from "./entry/index.html";

const parsed = parseHTML(str);
Object.assign(global, Object.fromEntries([
    'document',
    'IntersectionObserver',
    'MutationObserver',
    'window',
    'Document',
    'MessageEvent',
    'HTMLElement',
    'customElements',
    'requestAnimationFrame'
].map(key => [key, parsed[key]])));


class IntersectionObserver{

}

Object.assign(global, {
    IntersectionObserver,
    getSelection: ()=>null,
    requestAnimationFrame: (handler) => {
        Promise.resolve().then(handler)
    }

})