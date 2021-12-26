import {Injectable, utc} from "@hypertype/core";
import {IMessageActions} from "@domain/contracts/actions";
import {Message} from "@model";
import {Factory} from "./factory";
import {Model} from "@common/domain";
import {ContextStore} from "@infr/y/contextStore";

@Injectable(true)
export class MessageModel extends Model<Message, IMessageActions> {

    public get Context() {
        return this.factory.GetOrCreateContext(this.$state().Context.URI);
    }

    public get SubContext() {
        return this.$state().SubContext ? this.factory.GetOrCreateContext(this.$state().SubContext.URI) : null;
    }

    constructor(private readonly factory: Factory, private contextStore: ContextStore, public id: string) {
        super();
    }

    public get State() {
        return Message.FromJSON(this.contextStore.State().Messages.find(x => x.id === this.id));
    }

    public set State(value: Readonly<Message>) {
        const cur = this.contextStore.State();
        if (Message.equals(this.State)(value))
            return;
        this.contextStore.State({
            Context: cur.Context,
            Messages: [...cur.Messages.filter(x => x.id !== value.id), Message.ToJSON({
                ...value,
                UpdatedAt: utc()
            })]
        });
    }

    public Actions: IMessageActions = Object.assign(Object.create(this), {


        async UpdateText(text: string): Promise<void> {
            this.State = {
                ...this.State,
                UpdatedAt: utc(),
                Content: text
            };
        },


        async Attach(uri: string): Promise<void> {
            this.State = {
                ...this.State,
                UpdatedAt: utc(),
                SubContext: {
                    URI: uri
                } as any
            };
        },

        async Move(fromURI, toURI, toIndex: number) {
            if (fromURI == toURI)
                return await this.Reorder(toIndex);
            const oldContext = this.factory.GetOrCreateContext(fromURI);
            if (oldContext) {
                await oldContext.Actions.RemoveMessage(this.id);
            }
            const context = this.factory.GetOrCreateContext(toURI);
            await context.Actions.CreateMessage(this.State);
            await this.Reorder(toIndex);
        },

        async Reorder(newOrder: number): Promise<void> {
            if (!this.Context)
                return;
            this.Context.Actions.ReorderMessage(this, newOrder);
        }
    });

}

