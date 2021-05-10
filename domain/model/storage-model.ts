import {Model} from "@hypertype/domain";
import {Context, Message, Sorting, Storage} from "@model";
import {DomainModel} from "./domain-model";
import {ContextModel} from "./context-model";
import {IFactory} from "./i-factory";
import {IStorageActions} from "../contracts/actions";
import {IRepository} from "../contracts/repository";
import { StorageJSON} from "@domain/contracts/json";
import {MessageModel} from "@domain/model/message-model";
import {ulid} from "ulid";
import {utc} from "@hypertype/core";
import {LocalRepository} from "@infr/local/local.repository";
import {SolidRepository} from "@infr/solid";
import {SolidCachedRepository} from "@infr/solid-cached-repository";

export class RepositoryProvider{
    public static get(storage: Storage): IRepository{
        switch (storage.Type){
            case 'local':
                return new LocalRepository(storage.URI);
            case 'solid':
                return new SolidRepository(storage.URI);
        }
    }
}

export class StorageModel implements IStorageActions{
    public Root: ContextModel;
    public Contexts = new Map<string, ContextModel>();
    public Messages = new Map<string, MessageModel>();

    public get URI(): string{ return  this.State.URI; }
    public Type: string;
    public repository = RepositoryProvider.get(this.State)

    constructor(protected readonly factory: IFactory,
                public readonly State: Storage,
                private readonly domain: DomainModel) {
        this.repository.State$.subscribe(async json => {
            await this.FromServer(json);
            this.domain.Update();
        })
    }
    //
    // FromJSON(state: Storage): any {
    //     this.State.URI = state.URI;
    //     this.State.Type = state.Type;
    // }

    ToJSON(): Storage {
        return this.State;
    }

    public async Load(): Promise<void> {
        await this.repository.Load();
    }

    protected async FromServer(json: StorageJSON){
        for (let message of json.Messages) {
            let model = this.factory.GetMessage(message.URI);
            if (!model){
                model = this.factory.GetOrCreateMessage(Message.FromJSON(message), this);
            } else {
                model.Update(message);
            }
            this.State.Messages.set(model.URI, model.State);
            this.Messages.set(model.URI, model);
        }
        for (let context of json.Contexts) {
            let model = this.factory.GetContext(context.URI);
            if (!model) {
                model = this.factory.GetOrCreateContext({
                    ...Context.FromJSON(context),
                    Storage: this.State,
                    Messages: [],
                    Parents: [],
                }, this);
            }else{
                model.Update(context);
            }

            let messages = json.Messages
                .filter(x => x.ContextURI == context.URI)
                .map(x => this.Messages.get(x.URI).State)
                .orderBy(x => x.Order);
            // if (context.Permutation != null) {
            //     messages = Permutation.Parse(context.Permutation).Invoke(messages);
            // }
            const parents = json.Messages
                .filter(x => x.SubContextURI == context.URI)
                .map(x => this.Messages.get(x.URI).State);
            model.Link(messages, parents);
            this.Contexts.set(model.URI, model);
            this.State.Contexts.set(model.URI, model.State);
        }
        for (let context of json.Contexts) {
            const model = this.factory.GetContext(context.URI);
            model.Update(context);
        }
        this.Root = [...this.Contexts.values()].find(x => x.State.IsRoot);
        if (!this.Root){
            const uri  = await this.CreateContext({
                URI: undefined,
                IsRoot: true,
                id: ulid(),
                // Permutation: null,
                // Sorting: Sorting[Sorting.Time] as string,
                Storage: this.State,
                Parents: [],
                Messages: [],
                UpdatedAt: utc(),
                CreatedAt: utc(),
            });
            this.Root = this.Contexts.get(uri);
        }
        this.State.Root = this.Root.State;
    }

    public async CreateMessage(state: Message): Promise<string> {
        state.URI = `${state.Context.URI}#${state.id}`;
        console.log('domain.add-message', state, state.URI);
        await this.repository.Messages.Create(Message.ToJSON(state));
        const model = this.factory.GetOrCreateMessage(state, this);

        if (!model.State.Context?.Messages.includes(model.State))
            model.State.Context?.Messages.push(model.State);

        this.Messages.set(model.URI, model);
        this.State.Messages.set(model.URI, model.State);
        return model.URI;
    }
    public async CreateContext(context: Context): Promise<string> {
        context.URI = `${this.URI}/${context.id}.ttl`;
        await this.repository.Contexts.Create(Context.ToJSON(context));
        const result = this.factory.GetOrCreateContext(context, this);
        result.Link([], context.Parents);
        for (let parent of result.Parents) {
            this.repository.Messages.Update(parent.ToJSON());
        }
        this.Contexts.set(result.URI, result);
        this.State.Contexts.set(result.URI, result.State);
        return  result.URI;
    }

    public async Remove(): Promise<void> {
        this.repository.Clear();
    }
    public async Clear(): Promise<void> {
        this.repository.Clear();
    }

}

