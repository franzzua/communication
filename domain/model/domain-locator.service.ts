import {Container, Injectable} from "@cmmn/core";
import {ContextModel} from "./context-model";
import {RootLocator} from "@cmmn/domain/worker";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {DomainModel} from "@domain/model/domain-model";

@Injectable()
export class DomainLocator extends RootLocator {

    constructor(private container: Container) {
        super(null);
        // @ts-ignore
        this.root = container.get<DomainModel>(DomainModel, [
            {provide: DomainLocator, useValue: this}
        ])
    }

    public get Root(): DomainModel {
        // @ts-ignore
        return this.root;
    }

    public GetOrCreateContext(uri: string, parentURI: string): ContextModel {
        return this.Root.Contexts.has(uri) ?
            this.Root.Contexts.get(uri) :
            this.Root.Contexts.create(uri, parentURI);
    }

    public GetContext(uri: string): ContextModel | undefined {
        return this.Root.Contexts.get(uri);
    }


}

