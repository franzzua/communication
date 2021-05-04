import {ContentType, Transaction, XmlElement, XmlFragment} from "yjs";
import {YEvent} from "yjs/dist/src/utils/YEvent";
import * as h from "@hypertype/core";


export interface CRD<TItem  extends {id?: string}>{
    Create(item: TItem);
    Update(id: string, changes: Partial<TItem>);
    Delete(id: string);
}

export class ItemSync<TItem extends { id?: string }> implements CRD<TItem> {

    private mapping = new Map<string, {
        element: XmlElement,
        item: TItem
    }>();

    constructor(private root: XmlFragment, private nodeName) {
    }

    public Subscribe(crd: CRD<TItem>) {
        const observer = (events: Array<YEvent>, transaction: Transaction) => {
            for (let event of events) {
                // @ts-ignore
                // console.log(event.transaction.local ? 'local': 'another', this.stateService.logService.Instance);
                if (event.transaction.local)
                    continue;
                for (let added of event.changes.added) {
                    const element = ((added.content as ContentType).type as XmlElement);
                    const item = element.getAttributes() as TItem;
                    crd.Create(item);
                    this.mapping.set(item.id, {element, item});
                }
                for (let added of event.changes.deleted) {
                    const element = ((added.content as ContentType).type as XmlElement);
                    // @ts-ignore // TODO: fix getAttribute()
                    const id = element._map.get("id").content.arr[0];
                    crd.Delete(id);
                    this.mapping.delete(id);
                }
                if (event.changes.keys.size > 0) {
                    const element = event.target as XmlElement;
                    const id = [...this.mapping.entries()].find(x => x[1].element == element)[0];
                    const changes = {} as Partial<TItem>
                    for (let [key, change] of event.changes.keys) {
                        const value = element.getAttribute(key);
                        changes[key] = value;
                    }
                    this.mapping.set(id, {element, item: {
                        ...this.mapping.get(id).item,
                        ...changes
                    }});
                    crd.Update(id, changes);
                }
            }
        };
        this.root.observeDeep(observer);
        return () => this.root.unobserveDeep(observer);
    }

    public Changes$ = new h.Observable<{ Action, Args }>(subscr => {
        const crd = new Proxy({}, {
            get(target: {}, p: PropertyKey, receiver: any): any {
                return async (...args) => subscr.next({
                    Action: p,
                    Args: args
                });
            }
        }) as CRD<TItem>;
        const unsubscribe = this.Subscribe(crd);
        return () => unsubscribe();
    }).pipe(
        h.shareReplay(1)
    );

    public Create(item: TItem) {
        const element = new XmlElement(this.nodeName);
        this.mapping.set(item.id, {
            element, item
        });
        for (let key of Object.getOwnPropertyNames(item)) {
            element.setAttribute(key, item[key]);
        }
        this.root.push([element]);
    }

    public Update(id: string, changes: Partial<TItem>) {
        if (!this.mapping.has(id))
            throw new Error("update of unknown item");
        const {element} = this.mapping.get(id);
        this.root.doc.transact(() => {
            for (let key of Object.getOwnPropertyNames(changes)) {
                element.setAttribute(key, changes[key]);
            }
        });
    }

    private getIndex(element: XmlElement) {
        for (let i = 0; i < this.root.length; i++) {
            if (this.root.get(i) == element)
                return i;
        }
        throw new Error("Get index of unknown element");
    }

    public Delete(id: string) {
        if (!this.mapping.has(id))
            throw new Error("delete of unknown item");
        const {element} = this.mapping.get(id);
        const index = this.getIndex(element);
        this.root.delete(index);
    }

    public ToJSON() {
        return [...this.mapping.values()].map(x => x.item);
    }
}
