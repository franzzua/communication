import {Injectable} from "@common/core";
import {ContextProxy} from "./context-proxy";
import {DomainProxy} from "./domain-proxy.service";

@Injectable()
export class StateService {

    constructor(
        private root: DomainProxy
    ) {
        // this.domainProxy.State$.subscribe(x => console.log('storage', x.Storages[0]));
        // @ts-ignore
        window.state = this;
    }


    // public async LoadStorageForContext(uri: string): Promise<string> {
    //
    //     await this.root.Actions.LoadContext(uri);
    //     return uri;
    // }

}

