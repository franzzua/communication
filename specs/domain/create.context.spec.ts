import '../polyfills';
import {expect, suite, test,} from '@hypertype/tools/test';
import {clearMocks, getTestContainer} from "../container";
import {DomainModel, StorageModel} from "@domain/model";
import {Sorting} from "@model";
import { utc } from '@hypertype/core';

@suite()
export class CreateContextSpec {
    private domain: DomainModel;
    private storage: StorageModel;
    private storageURI = 'local://default';

    constructor() {
    }

    async before(){
        this.domain = await this.GetInstance();
        this.storage = await this.domain.CreateStorage({Type: 'local', URI: this.storageURI, Messages: [], Contexts: []});
        await this.storage.CreateContext({
            IsRoot: true,
            URI: 'root',
            UpdatedAt: utc().toISO(),
            Sorting: Sorting[Sorting.Time],
            MessageURIs: [],
            ParentsURIs: []
        })
    }

    private async GetInstance() {
        const container = getTestContainer();
        return container.get<DomainModel>(DomainModel);
    }


    @test()
    public async CreateStorage() {
        expect(this.storage.State.URI).equal(this.storageURI);
        expect(this.storage.Root).not.null;
        expect(this.storage.Root.State.URI).not.null;
        // expect(this.storage.Root.State.Messages).lengthOf(0);
    }

    @test()
    public async CreateMessage() {
        const msg1uri = await this.storage.Root.AddMessage({
            Content: 'first',
            StorageURI: this.storageURI,
            CreatedAt: utc().toISO(),
        });
        expect(msg1uri).not.null;
        const msg2URI = await this.storage.Root.AddMessage({
            Content: 'second',
            StorageURI: this.storageURI,
            CreatedAt: utc().toISO(),
        });
        expect(msg2URI).not.null;
        expect(msg2URI).not.equal(msg1uri);

        // await this.storage.CreateContext({
        //     URI:
        // });
    }
    @test()
    public async UpdateText() {
        const msg1URI = await this.storage.Root.AddMessage({
            Content: 'first',
            StorageURI: this.storageURI,
            CreatedAt: utc().toISO(),
        });
        const msg1 = this.storage.Messages.get(msg1URI);
        await msg1.UpdateText('second');
    }
    @test()
    public async CreateContext() {
        const contextURI = await this.storage.CreateContext({
            Sorting: Sorting[Sorting.Alphabetically],
            StorageURI: this.storageURI,
            MessageURIs: [],
            ParentsURIs: []
        });
        const context = this.storage.Contexts.get(contextURI);
        expect(context.State.URI).not.null;
        expect(context.State.URI).not.equal(this.storage.Root.State.URI);
    }

    @test()
    public async CreateCycleSubTree() {
        const msg1URI = await this.storage.Root.AddMessage({
            StorageURI: this.storageURI,
            CreatedAt: utc().toISO(),
            Content: 'first'
        });
        const msg1 = this.storage.Messages.get(msg1URI);
        const contextURI = await this.storage.CreateContext({
            Sorting: Sorting[Sorting.Alphabetically],
            StorageURI: this.storageURI,
            MessageURIs: [],
            ParentsURIs: [msg1.URI],
            URI: undefined,
            Permutation: null,
        });
        const context = this.storage.Contexts.get(contextURI);
        const msg2URI = await context.AddMessage({
            CreatedAt: utc().toISO(),
            StorageURI: this.storageURI,
            ContextURI: contextURI,
            Content: 'second',
        });
        const msg2 = this.storage.Messages.get(msg2URI);
        await msg2.Attach(this.storage.Root.URI);
        expect(context.State.URI).not.null;
        expect(context.State.URI).not.equal(this.storage.Root.State.URI);
        expect(this.storage.Root.Messages.find(x => x.URI == msg1URI).SubContext.Messages.find(x => x.URI == msg2URI).SubContext).equal(this.storage.Root);
        expect(this.storage.Root.Parents.find(x => x.URI == msg2URI).Context.Parents.find(x => x.URI == msg1URI).Context).equal(this.storage.Root);
        const json = this.storage.ToJSON()
        const res = JSON.stringify(json);
    }

    after() {
        clearMocks();
    }
}

