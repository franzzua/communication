import {ContextProxyMock} from "./context-proxy.mock";

export class DomainProxyMock {

    constructor() {
    }


    _contextsMap = new Map<string, ContextProxyMock>([
        ['test', new ContextProxyMock([1,2,3])]
    ]);

    // @ts-ignore
    get ContextsMap(){
        return this._contextsMap;
    }

}


