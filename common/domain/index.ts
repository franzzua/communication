import {IFactory} from "./shared/factory";
import {Container} from "@common/core";
import {ProxyFactory} from "./proxyFactory";
import {Stream} from "./stream";
import {DirectStream} from "./direct-stream";
import {WorkerStream} from "./workerStream";
import {Action} from "./shared/types";
export {proxy} from "./shared/domain.structure";
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
export function useStreamDomain(Factory: {new(...args):IFactory}) {
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, Factory, {
        provide: Stream, useClass: DirectStream, deps: [Factory]
    });
}

export async function useWorkerDomain(workerUrl: string) {
    const stream = new WorkerStream(workerUrl);
    await stream.Connected;
    return Container.withProviders({
        provide: IFactory, useClass: ProxyFactory
    }, {
        provide: Stream, useValue: stream
    });
}
