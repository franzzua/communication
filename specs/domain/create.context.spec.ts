import '../polyfills';
import { expect, suite, test, } from '@cmmn/tools/test';
import { clearMocks, getTestContainer } from "../container";
import { utc } from '@cmmn/core';
import { DomainLocator } from "@domain/model/domain-locator.service";
import { ContextModel, MessageModel } from "@domain/model";
import { Context, Message } from "@model";
import { IContextActions, IMessageActions } from "@domain";
import { Permutation } from "@domain/helpers/permutation";
import { DomainProxy } from "@services";

@suite()
export class CreateContextSpec {
    private locator: DomainLocator;
    private storageURI = 'local://default';

    constructor() {
    }

    async before() {
        this.locator = await this.GetLocator();
        await this.locator.Root.Actions.CreateContext({
            IsRoot: true,
            URI: 'root',
            UpdatedAt: utc(),
            CreatedAt: utc(),
            Messages: [],
            Storage: null,
            id: undefined
        })
    }

    private async GetLocator() {
        const container = getTestContainer();
        const locator = container.get<DomainLocator>(DomainLocator);
        const context = locator.GetOrCreateContext('root', null)
        context.State = {
            URI: 'root',
            id: 'root',
            Messages: [],
            CreatedAt: utc(),
            IsRoot: true,
            UpdatedAt: utc(),
            Permutation: null,
            Storage: null
        };
        return locator;
    }


    @test()
    public async MessageOrdering() {
        const context = this.locator.get<Context, IContextActions>([ 'Contexts', 'root' ]) as ContextModel;
        await context.CreateMessage({
            Content: 'Hi1',
            ContextURI: context.State.URI,
            CreatedAt: utc(),
            id: '1',
            UpdatedAt: utc()
        });
        await context.CreateMessage({
            Content: 'Hi2',
            ContextURI: context.State.URI,
            CreatedAt: utc(),
            id: '2',
            UpdatedAt: utc()
        });
        expect(context.State.Messages).toHaveLength(2);
        context.State = {
            ...context.State,
            Permutation: Permutation.Parse('[1,0]')
        }
        expect(context.State.Messages).toEqual([ '2', '1' ]);
        const message = this.locator.get<Message, IMessageActions>([ 'Contexts', 'root', 'Messages', '1' ]) as MessageModel;
        expect(message.State.Content).toEqual('Hi1');
        // expect(this.storage.State.URI).equal(this.storageURI);
        // expect(this.storage.Root).not.null;
        // expect(this.storage.Root.State.URI).not.null;
        // expect(this.storage.Root.State.Messages).lengthOf(0);
    }

    @test()
    public async ModelProxy(){
        const container = getTestContainer();
        const domainProxy = container.get<DomainProxy>(DomainProxy);
        const context = domainProxy.ContextsMap.get('root');
        expect(context.State.URI).toEqual('root');
        await context.Actions.CreateMessage({
            Content: 'Hi1',
            ContextURI: context.State.URI,
            CreatedAt: utc(),
            id: '1',
            UpdatedAt: utc()
        });
        await context.Actions.CreateMessage({
            Content: 'Hi2',
            ContextURI: context.State.URI,
            CreatedAt: utc(),
            id: '2',
            UpdatedAt: utc()
        }, 0);
    }

    @test()
    public async CreateMessage() {
        // const msg1uri = await this.storage.Root.AddMessage({
        //     Content: 'first',
        //     StorageURI: this.storageURI,
        //     CreatedAt: utc().toISO(),
        // });
        // expect(msg1uri).not.null;
        // const msg2URI = await this.storage.Root.AddMessage({
        //     Content: 'second',
        //     StorageURI: this.storageURI,
        //     CreatedAt: utc().toISO(),
        // });
        // expect(msg2URI).not.null;
        // expect(msg2URI).not.equal(msg1uri);

        // await this.storage.CreateContext({
        //     URI:
        // });
    }

    @test()
    public async UpdateText() {
        // const msg1URI = await this.storage.Root.AddMessage({
        //     Content: 'first',
        //     StorageURI: this.storageURI,
        //     CreatedAt: utc().toISO(),
        // });
        // const msg1 = this.storage.Messages.get(msg1URI);
        // await msg1.UpdateText('second');
    }

    @test()
    public async CreateContext() {
        // const contextURI = await this.storage.CreateContext({
        //     Sorting: Sorting[Sorting.Alphabetically],
        //     StorageURI: this.storageURI,
        //     MessageURIs: [],
        //     ParentsURIs: []
        // });
        // const context = this.storage.Contexts.get(contextURI);
        // expect(context.State.URI).not.null;
        // expect(context.State.URI).not.equal(this.storage.Root.State.URI);
    }

    @test()
    public async CreateCycleSubTree() {
        // const msg1URI = await this.storage.Root.AddMessage({
        //     StorageURI: this.storageURI,
        //     CreatedAt: utc().toISO(),
        //     Content: 'first'
        // });
        // const msg1 = this.storage.Messages.get(msg1URI);
        // const contextURI = await this.storage.CreateContext({
        //     Sorting: Sorting[Sorting.Alphabetically],
        //     StorageURI: this.storageURI,
        //     MessageURIs: [],
        //     ParentsURIs: [msg1.URI],
        //     URI: undefined,
        //     Permutation: null,
        // });
        // const context = this.storage.Contexts.get(contextURI);
        // const msg2URI = await context.AddMessage({
        //     CreatedAt: utc().toISO(),
        //     StorageURI: this.storageURI,
        //     ContextURI: contextURI,
        //     Content: 'second',
        // });
        // const msg2 = this.storage.Messages.get(msg2URI);
        // await msg2.Attach(this.storage.Root.URI);
        // expect(context.State.URI).not.null;
        // expect(context.State.URI).not.equal(this.storage.Root.State.URI);
        // expect(this.storage.Root.Messages.find(x => x.URI == msg1URI).SubContext.Messages.find(x => x.URI == msg2URI).SubContext).equal(this.storage.Root);
        // expect(this.storage.Root.Parents.find(x => x.URI == msg2URI).Context.Parents.find(x => x.URI == msg1URI).Context).equal(this.storage.Root);
        // const json = this.storage.ToJSON()
        // const res = JSON.stringify(json);
    }

    after() {
        clearMocks();
    }
}

