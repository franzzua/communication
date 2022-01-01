import {Injectable} from "@hypertype/core";
import {IFactory, Model} from "@common/domain";
import {IDomainActions} from "../contracts/actions";
import {Context, DomainState, Message} from "@model";
import {ContextModel} from "@domain/model/context-model";

@Injectable()
export class DomainModel extends Model<DomainState, IDomainActions> {
    public Contexts: Map<string, ContextModel> = new Map<string, ContextModel>();

    constructor(private factory: IFactory) {
        super();
        window['domain'] = this;
        // this.useLastUpdate = true;
    }

    public get Root(){
        return [...this.Contexts.values()].find(x => x.State.IsRoot);
    }

    public set State(state: DomainState) {
    }

    public get State(): DomainState {
        const state = {
            Contexts: new Map<string, Readonly<Context>>(),
            Messages: new Map<string, Readonly<Message>>()
        };
        for (let context of this.Contexts.values()) {
            this.toJSON(context, state);
        }
        return state;
    }

    private toJSON(context: ContextModel, output: DomainState) {
        if (output.Contexts.has(context.URI))
            return output.Contexts.get(context.URI);
        const contextState = context.ToJSON();
        output.Contexts.set(context.URI, contextState);
        contextState.Messages = context.OrderedMessages.map(msg => ({
            ...msg.State,
            Context: contextState,
            SubContext: msg.SubContext ? this.toJSON(msg.SubContext, output) : null
        }));
        return contextState;
    }


    public Actions: IDomainActions = Object.assign(Object.create(this), {
        async LoadContext(uri: string) {
            this.Contexts.set(uri, this.factory.GetOrCreateContext(uri));
        },

        async CreateContext(context: Context): Promise<void> {
            const model: ContextModel = this.factory.GetOrCreateContext(context.URI);
            model.State = context;
            for (const parent of context.Parents) {
                const messageModel = this.factory.GetModel('Message', parent.id);
                messageModel.Actions.Attach(model.URI);
            }
        }
    });

}

