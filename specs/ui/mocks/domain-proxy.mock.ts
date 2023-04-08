import { utc } from "@cmmn/core";
import {ContextProxyMock} from "./context-proxy.mock";

export class DomainProxyMock {

    constructor() {
        this._contextsMap.get('test').Messages[1].AddMessage({
            Content: '3',
            id: '3',
            CreatedAt: utc(),
        } as any)
    }


    _contextsMap = new Map<string, ContextProxyMock>([
        ['test', new ContextProxyMock('test',[1,2])]
    ]);

    // @ts-ignore
    get ContextsMap(){
        return this._contextsMap;
    }

    get State(){
        return {};
    }

}


