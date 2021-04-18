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

    constructor() {
    }

    async before(){
        this.domain = await this.GetInstance();
        this.storage = await this.domain.CreateStorage({Type: 'local', URI: this.storageURI, Messages: [], Contexts: []});
    }

    private async GetInstance() {
        const container = getTestContainer();
        return container.get<DomainModel>(DomainModel);
    }

    private storageURI = 'local://default';

    @test()
    public async CreateStorage() {
        expect(this.storage.State.URI).equal(this.storageURI);
        expect(this.storage.Root).not.null;
        expect(this.storage.Root.State.URI).not.null;
        // expect(this.storage.Root.State.Messages).lengthOf(0);
    }

    @test()
    public async CreateMessage() {
        const msg1 = await this.storage.Root.AddMessage({
            Content: 'first',
            CreatedAt: utc(),
        });
        expect(msg1.State.URI).not.null;
        const msg2 = await this.storage.Root.AddMessage({
            Content: 'second',
            CreatedAt: utc(),
        });
        expect(msg2.State.URI).not.null;
        expect(msg2.State.URI).not.equal(msg1.State.URI);

        // await this.storage.CreateContext({
        //     URI:
        // });
    }
    @test()
    public async UpdateText() {
        const msg1 = await this.storage.Root.AddMessage({
            Content: 'first',
            CreatedAt: utc(),
        });
        await msg1.UpdateText('second');
    }
    @test()
    public async CreateContext() {
        const context = await this.storage.CreateContext({
            Sorting: Sorting.Alphabetically,
            MessageURIs: [],
            ParentsURIs: []
        });
        expect(context.State.URI).not.null;
        expect(context.State.URI).not.equal(this.storage.Root.State.URI);
    }

    @test()
    public async CreateCycleSubTree() {
        const msg1 = await this.storage.Root.AddMessage({
            CreatedAt: utc(),
            Content: 'first'
        });
        const context = await this.storage.CreateContext({
            Sorting: Sorting.Alphabetically,
            MessageURIs: [],
            ParentsURIs: [msg1.URI],
            URI: undefined,
            Permutation: null,
        });
        const msg2 = await context.AddMessage({
            CreatedAt: utc(),
            Content: 'second',
        });
        await msg2.Attach(this.storage.Root.URI);
        expect(context.State.URI).not.null;
        expect(context.State.URI).not.equal(this.storage.Root.State.URI);
        expect(this.storage.Root.Messages[0].SubContext.Messages[0].SubContext).equal(this.storage.Root);
        expect(this.storage.Root.Parents[0].Context.Parents[0].Context).equal(this.storage.Root);
        const json = this.storage.ToJSON()
        const res = JSON.stringify(json);
    }

    after() {
        clearMocks();
    }
}

