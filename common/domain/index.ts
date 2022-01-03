import {IFactory} from "./shared/factory";
import {Container} from "@hypertype/core";
import {ProxyFactory} from "./proxyFactory";
import {Stream} from "./stream";
import {DirectStream} from "./direct-stream.service";
import {WorkerStream} from "./workerStream";
import {Action} from "./shared/types";

export type {Model} from "./worker/model";
export {IFactory} from "./shared/factory";
export {ProxyFactory} from "./proxyFactory";
export {ModelProxy} from "./modelProxy";
export {Stream} from "./stream";
export {WorkerStream} from "./workerStream";
export {Action};

export function useDomain(factory: IFactory) {
    return Container.withProviders({
        provide: IFactory, useValue: factory
    });
}
export function useStreamDomain(factory: IFactory) {
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, {
        provide: Stream, useValue: new DirectStream(factory)
    });
}

export function useWorkerDomain(workerUrl: string) {
    const stream = new WorkerStream(workerUrl);
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, {
        provide: Stream, useValue: stream
    });
}
