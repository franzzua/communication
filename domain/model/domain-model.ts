import {Injectable} from "@common/core";
import {IFactory, Model} from "@common/domain/worker";
import {IDomainActions} from "@domain";
import {Context, DomainState, Message} from "@model";
import {ContextModel} from "@domain/model/context-model";
import {Cell, cellx} from "cellx";
import type {Factory} from "@domain/model/factory";
import {ObservableMap} from "cellx-collections";

@Injectable()
export class DomainModel extends Model<DomainState, IDomainActions> {
    public ObsContexts = new ObservableMap<string, ContextModel>();
    public get Contexts(): ReadonlyMap<string, ContextModel> {
        return this.ObsContexts._entries;
    }
    private get factory(): Factory{
        return  this._factory as Factory;
    }
    private _contextsCell = new Cell(this.ObsContexts);

    constructor(private _factory: IFactory) {
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
        return (this.factory as Factory).CreateContext(uri);
    };
}

