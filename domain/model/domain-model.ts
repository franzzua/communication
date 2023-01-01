import {ModelLike} from "@cmmn/domain/worker";
import {IDomainActions} from "@domain";
import {Context, DomainState} from "@model";
import {ContextModel} from "@domain/model/context-model";
import {cell} from "@cmmn/cell";
import {DomainLocator} from "@domain/model/domain-locator.service";
import {YjsRepository} from "@infr/yjs/yjsRepository";
import {Injectable} from "@cmmn/core";
import {ContextMap} from "@domain/model/context-map";
import {SelectionState} from "../../model/storage";

@Injectable()
export class DomainModel implements ModelLike<DomainState, IDomainActions>, IDomainActions {
    @cell
    public Contexts = new ContextMap(this.locator, this.repository);

    @cell
    public Selection: SelectionState = {};

    constructor(private locator: DomainLocator,
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
            Selection: this.Selection
            // Messages: (this.factory as Factory).MessageMap.map(x => x.State),
        };
    }

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

    async CreateContext(context: Context): Promise<void> {
        const model: ContextModel = this.Contexts.get(context.URI);
        model.State = context;
        // for (const parent of context.Parents) {
        //     console.warn('TODO:')
        //     const messageModel = this.factory.GetContext(parent);
        //     messageModel.Actions.Attach(model.URI);
        // }
    };

}

