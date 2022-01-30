import {Container, Injectable} from "@cmmn/core";
import {ContextModel} from "./context-model";
import {IFactory, Model, ModelAction, ModelPath} from "@cmmn/domain";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {DomainModel} from "@domain/model/domain-model";

@Injectable()
export class Factory implements IFactory<DomainModel> {

    constructor(private container: Container,
                private repository: YjsRepository) {
    }


    public Root: DomainModel = new DomainModel(this);

    public GetModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.Root.QueryModel<TState, TActions>(path.slice(1)) as Model<TState, TActions>;
    }

    public GetOrCreateContext(uri: string, parentURI: string): ContextModel {
        return this.GetContext(uri) ?? this.CreateContext(uri, parentURI);
    }

    public CreateContext(uri: string, parentURI: string): ContextModel {
        const contextStore = this.repository.LoadContext(uri, parentURI);
        const context = new ContextModel(uri, contextStore, this);
        this.Root.ObsContexts.set(uri, context);
        return context;
    }

    public GetContext(uri: string): ContextModel {
        return this.Root.ObsContexts.get(uri);
    }
}

