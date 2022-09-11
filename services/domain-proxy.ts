import {Injectable} from "@cmmn/core";
import {Context, DomainState} from "@model";
import {EntityLocator, ModelMap, ModelProxy, proxy, Stream} from "@cmmn/domain/proxy";
import type {IDomainActions} from "@domain";
import {ContextProxy} from "./context-proxy";

@Injectable()
@proxy.of(DomainState)
export class DomainProxy extends ModelProxy<DomainState, IDomainActions> {
    constructor(stream: Stream, locator: EntityLocator) {
        super(stream, locator);
        window['root'] = this;
    }

    get Contexts(): ReadonlyArray<ContextProxy> {
        return [...this.ContextsMap.values()];
    }

    @proxy.map<DomainState>(Context, d => d.Contexts)
    ContextsMap: ModelMap<ContextProxy>;
}

