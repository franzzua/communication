import {ModelLike, Locator} from "@cmmn/domain/worker";
import {IDomainActions} from "@domain";
import {DomainState} from "@model";
import {cell} from "@cmmn/cell";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {Injectable} from "@cmmn/core";
import {ContextMap} from "@domain/model/context-map";
import {SelectionState} from "../../model/storage";

@Injectable()
export class DomainModel implements ModelLike<DomainState, IDomainActions>, IDomainActions {
    @cell
    public Contexts = new ContextMap(this.locator as any, this.repository);

    @cell
    public Selection: SelectionState = {};

    constructor(private locator: Locator,
                private repository: YjsRepository) {
        globalThis['domain'] = this;
        // this.useLastUpdate = true;
    }

    // public get Root() {
    //     return [...this.Contexts.values()].find(x => x.State.IsRoot);
    // }

    public set State(state: DomainState) {
        this.Selection = state.Selection;
    }

    public get State(): DomainState {
        return {
            Contexts: Array.from(this.Contexts.keys()),
            Selection: this.Selection,
            Servers: this.repository.Provider.ServerState,
            Networks: new Map(Array.from(this.repository.Networks.toMap().entries())
                .map(([key, network]) => [key, network.map])),
            // Messages: (this.factory as Factory).MessageMap.map(x => x.State),
        };
    }

    async CreateContext(uri: string, parentURI: string): Promise<void> {
        this.Contexts.create(uri, parentURI);
        // for (const parent of context.Parents) {
        //     console.warn('TODO:')
        //     const messageModel = this.factory.GetContext(parent);
        //     messageModel.Actions.Attach(model.URI);
        // }
    };

    //
    // private toJSON(context: ContextModel, output: DomainState) {
    //     if (output.Contexts.has(context.URI))
    //         return output.Contexts.get(context.URI);
    //     const contextState = context.ToJSON();
    //     output.Contexts.set(context.URI, contextState);
    //     contextState.Messages = context.OrderedMessages.map(msg => msg.id);
    //     return contextState;
    // }

    public Actions: IDomainActions = this;
    // async LoadContext(uri: string) {
    //     const context = this.factory.GetOrCreateContext(uri);
    // };
    //


}

