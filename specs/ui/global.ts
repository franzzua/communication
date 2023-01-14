import * as dom from "linkedom";
import {parseHTML} from "linkedom";
import str from "./entry/index.html";
import {Poly} from "./poly";

if (!global.document) {
    const parsed = parseHTML(str);
    Object.assign(global, Object.fromEntries([
        'document',
        'MutationObserver',
        'window',
        'MessageEvent',
        'customElements',
    ].map(key => [key, parsed[key]])));
    Object.assign(global, dom)
    Object.assign(global, Poly)
}

