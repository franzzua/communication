import {Model} from "@cmmn/domain/worker";
import {IDomainActions} from "@domain";
import {DomainState} from "@model";
import {ContextModel} from "@domain/model/context-model";
import {Cell} from "@cmmn/core";
import {Factory} from "@domain/model/factory";
import {ObservableMap} from "cellx-collections";

export class DomainModel extends Model<DomainState, IDomainActions> {
    public ObsContexts = new ObservableMap<string, ContextModel>();

    public get Contexts(): ReadonlyMap<string, ContextModel> {
        return this.ObsContexts._entries;
    }

    private _contextsCell = new Cell(this.ObsContexts);

    constructor(private factory: Factory) {
        super();
        window['domain'] = this;
        // this.useLastUpdate = true;
    }

    // public get Root() {
    //     return [...this.Contexts.values()].find(x => x.State.IsRoot);
    // }

    public set State(state: DomainState) {
        // return {
        //     Contexts: new Map([...this.Contexts.values()].map(x => ([x.URI, {URI: x.URI} as Context]))),
        //     Messages: new Map([...this.Contexts.values()].flatMap(x => x.OrderedMessages.map(x => [x.id, {id: x.id} as Message]))),
        // };
    }

    public get State(): DomainState {
        return {
            Contexts: [...this._contextsCell.get()._entries.keys()],
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
    // async CreateContext(context: Context): Promise<void> {
    //     const model: ContextModel = this.factory.GetOrCreateContext(context.URI);
    //     model.State = context;
    //     for (const parent of context.Parents) {
    //         console.warn('TODO:')
    //         const messageModel = this.factory.GetContext(parent);
    //         messageModel.Actions.Attach(model.URI);
    //     }
    // };

    protected Factory = uri => {
        return this.factory.CreateContext(uri, null);
    };
}

