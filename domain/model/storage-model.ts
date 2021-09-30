import {Context, Message, Storage} from "@model";
import {DomainModel} from "./domain-model";
import {ContextModel} from "./context-model";
import {IFactory} from "./i-factory";
import {IRepository, IStorageActions} from "@domain";
import {StorageJSON} from "@domain/contracts/json";
import {MessageModel} from "@domain/model/message-model";
import {ulid} from "ulid";
import {utc} from "@hypertype/core";
// import {SolidRepository} from "@infr/solid";
import {MeldRepository} from "@infr/m-ld/meld.repository";
import {Model} from "@hypertype/domain";

export class RepositoryProvider {
    public static get(storage: {Type; URI}): IRepository {
        switch (storage.Type) {
            case 'local':
                return new MeldRepository(storage.URI);
            // case 'solid':
            //     return new SolidRepository(storage.URI);
        }
    }
}

export class StorageModel extends Model<Storage, IStorageActions> implements IStorageActions {
    public Root: ContextModel;
    public Contexts = new Map<string, ContextModel>();
    public Messages = new Map<string, MessageModel>();

    public get URI(): string {
        return this.State.URI;
    }

    public Type: string;
    public repository: IRepository;

    constructor(protected readonly factory: IFactory,
                public readonly State: Omit<Storage, keyof {Root, Contexts, Messages}>,
                readonly domain: DomainModel) {
        super();
        console.time('repository');
        this.repository =  RepositoryProvider.get(this.State)
        this.repository.State$.subscribe(async json => {
            console.timeEnd('repository');
            console.time('repository');
            await this.FromServer(json);
            this.domain.Update();
        })
    }

    //
    FromJSON(state: Storage): any {
        this.State.URI = state.URI;
        this.State.Type = state.Type;
    }

    ToJSON(): Storage {
        const messages = new Map([...this.Messages.values()].map(c => [c.URI, c.ToJSON()]));
        const storage = {
            ...this.State,
            Messages: messages,
            equals: (s: Storage) => {
                return false;
            }
        } as Storage;
        storage.Contexts = new Map([...this.Contexts.values()].map(c => {
            const context = c.ToJSON();
            context.Messages = c.Messages.map(x => messages.get(x.URI));
            context.Parents = c.Parents.map(x => messages.get(x.URI));
            context.Storage = storage;
            for (let parent of context.Parents) {
                parent.SubContext = context;
            }
            for (let message of context.Messages) {
                message.Context = context;
            }
            if (context.IsRoot)
                storage.Root = context;
            return [c.URI, context];
        }));

        return storage;
    }

    public async Load(): Promise<void> {
        await this.repository.Load();
    }

    protected async FromServer(json: StorageJSON) {
        for (let context of json.Contexts) {
            let model = this.factory.GetContext(context.URI);
            if (!model) {
                model = this.factory.GetOrCreateContext({
                    ...Context.FromJSON(context),
                    Storage: this.State,
                    Messages: [],
                    Parents: [],
                }, this);
            } else {
                model.FromServer(context);
            }
            // json.Messages
            //     .filter(x => x.ContextURI == context.URI)
            //     .map(x => this.Messages.get(x.URI))
            //     .forEach(m => model.AddChild(m));
            // json.Messages
            //     .filter(x => x.SubContextURI == context.URI)
            //     .map(x => this.Messages.get(x.URI))
            //     .forEach(m => model.AddParent(m));

            this.Contexts.set(model.URI, model);
            if (context.IsRoot)
                this.Root = model;
        }
        for (let message of json.Messages) {
            let model = this.factory.GetMessage(message.URI);
            if (!model) {
                model = this.factory.GetOrCreateMessage(Message.FromJSON(message), this);
            } else {
                model.FromServer(message);
            }
            this.Messages.set(model.URI, model);
        }
        // for (let message of json.Messages) {
        //     const model = this.factory.GetMessage(message.URI);
        //     const context = this.factory.GetContext(message.ContextURI);
        //     const subContext = message.SubContextURI && this.factory.GetContext(message.SubContextURI);
        //     model.Link(context, subContext);
        // }
        if (!this.Root) {
            const uri = await this.CreateContext({
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
    }

    public async CreateMessage(state: Message): Promise<string> {
        state.URI = `${state.Context.URI}#${state.id}`;
        console.log('domain.add-message', state, state.URI);
        await this.repository.Messages.Create(Message.ToJSON(state));
        const model = this.factory.GetOrCreateMessage(state, this);
        this.Messages.set(model.URI, model);

        return model.URI;
    }

    public async CreateContext(context: Context): Promise<string> {
        context.URI = `${this.URI}/${context.id}.ttl`;
        await this.repository.Contexts.Create(Context.ToJSON(context));
        const result = this.factory.GetOrCreateContext(context, this);
        const parents = context.Parents.map(x => this.factory.GetMessage(x.URI));
        parents.forEach(x => result.AddParent(x));
        for (let parent of result.Parents) {
            parent.Link(parent.Context, result);
            await this.repository.Messages.Update(parent.ToServer());
        }
        this.Contexts.set(result.URI, result);
        return result.URI;
    }

    public async Remove(): Promise<void> {
        this.repository.Clear();
    }

    public async Clear(): Promise<void> {
        this.repository.Clear();
    }

}

