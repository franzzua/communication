import {CRD} from "@domain/sync/item-sync";
import {ContextJSON, MessageJSON} from "@domain";
import {award} from "rdf-namespaces/dist/schema";
import {entity} from "solidocity";
import {key} from "rdf-namespaces/dist/vcard";

const queue: (() => Promise<any>)[] = [];
let isInvoking = false;
const invoke = () => {
    if (queue.length == 0 || isInvoking)
        return;
    isInvoking = true;
    // setTimeout(() => {
        queue.shift()().then(() => {
            isInvoking = false;
            return invoke();
        });
    // }, 500);
}



export const queueCRD = (crd: CRD<ContextJSON | MessageJSON>) => {
    function get(key: keyof CRD<ContextJSON | MessageJSON>){
        return (x: ContextJSON | MessageJSON) => {
            console.time(`${key} ${x.URI}`);
            return new Promise((resolve, reject) => {
                queue.push(
                    () => crd[key](x)
                        .then(resolve)
                        .catch(reject)
                        .then(() => console.timeEnd(`${key} ${x.URI}`))
                );
                invoke();
            });
        };
    }
    return ({
        Create: get('Create'),
        Update: get('Update'),
        Delete: get('Delete')
    });
};
