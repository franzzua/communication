import {filter, first, Injectable, map} from "@hypertype/core";
import {DomainProxy} from "@domain";
import {Context, Message, Storage} from "@model";

@Injectable()
export class ProxyProvider {
    constructor(private domainProxy: DomainProxy) {
    }

    public async GetStorageProxy(storage: {URI}) {
        await this.domainProxy.State$.pipe(
            map(x => x.Storages.find(x => x.URI == storage.URI)),
            filter(x => x != null),
            first()
        ).toPromise()
        return this.domainProxy
            .GetStorageProxy(storage.URI);
    }

    public async GetContextProxy(context: Context) {
        await this.domainProxy.State$.pipe(
            map(x => x.Storages.find(x => x.URI == context.Storage.URI)),
            filter(x => x != null),
            map(x => x.Contexts.get(context.URI)),
            filter(x => x != null),
            first()
        ).toPromise()
        return this.domainProxy
            .GetStorageProxy(context.Storage.URI)
            .GetContextProxy(context.URI)
    }

    public async GetMessageProxy(message: Message) {
        await this.domainProxy.State$.pipe(
            map(x => x.Storages.find(x => x.URI == message.Context.Storage.URI)),
            filter(x => x != null),
            map(x => x.Messages.get(message.URI)),
            filter(x => x != null),
            first()
        ).toPromise()
        return this.domainProxy
            .GetStorageProxy(message.Context.Storage.URI)
            .GetMessageProxy(message.URI)
    }
}
