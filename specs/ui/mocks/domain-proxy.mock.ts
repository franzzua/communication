import {ContextProxyMock} from "./context-proxy.mock";

export class DomainProxyMock {

    constructor() {
    }


    _contextsMap = new Map<string, ContextProxyMock>([
        ['test', new ContextProxyMock('test')]
    ]);

    // @ts-ignore
    get ContextsMap(){
        return this._contextsMap;
    }

}


