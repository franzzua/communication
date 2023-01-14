import {ObservableMap} from "@cmmn/cell";
import {ContextModel} from "@domain/model/context-model";
import {DomainLocator} from "@domain/model/domain-locator.service";
import {YjsRepository} from "@infr/yjs/yjsRepository";

export class ContextMap extends ObservableMap<string, ContextModel> {
    constructor(private locator: DomainLocator, private repository: YjsRepository) {
        super();
    }

    get(uri: string) {
        return super.get(uri) ?? this.create(uri, null);
    }

    public create(uri: string, parentURI: string): ContextModel {
        const contextStore = this.repository.GetOrAdd(uri, parentURI);
        const context = new ContextModel(uri, contextStore, this.locator);
        this.set(uri, context);
        return context;
    }
}