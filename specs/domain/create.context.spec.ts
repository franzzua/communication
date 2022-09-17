import '../polyfills';
import { expect, suite, test, } from '@cmmn/tools/test';
import { clearMocks, getTestContainer } from "../container";
import { Fn, utc } from '@cmmn/core';
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
    }

    private async GetLocator() {
        const container = getTestContainer();
        const locator = container.get<DomainLocator>(DomainLocator);
        const context = locator.GetOrCreateContext('https://example.com/root', null)
        context.State = {
            URI: 'https://example.com/root',
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

    private async GetRootContext(){
        const container = getTestContainer();
        const domainProxy = container.get<DomainProxy>(DomainProxy);
        const context = domainProxy.ContextsMap.get('root');
        await context.Actions.CreateMessage({
            Content: 'Hi1',
            ContextURI: context.State.URI,
            CreatedAt: utc(),
            id: '1',
            UpdatedAt: utc()
        });
        return context;
    }

    @test()
    public async Permutation(){
        const context = await this.GetRootContext();
        expect(context.State.id).toEqual('root');
        await context.Actions.CreateMessage({
            Content: 'Hi2',
            ContextURI: context.State.URI,
            CreatedAt: utc(),
            id: '2',
            UpdatedAt: utc()
        }, 0);
        expect(context.Messages).toHaveLength(2);
        expect(context.Messages[0].State.Content).toEqual('Hi2');
        expect(context.Messages[1].State.Content).toEqual('Hi1');
        await context.Diff(state => ({
            ...state,
            Permutation: Permutation.Parse('[0,1]')
        }));
        expect(context.Messages[0].State.Content).toEqual('Hi1');
        expect(context.Messages[1].State.Content).toEqual('Hi2');
    }
    @test()
    public async AddMessage(){
        const context = await this.GetRootContext();
        const message = context.Messages[0];
        const childMessage = await message.AddMessage({
            Content: 'X',
            CreatedAt: utc(),
            id: Fn.ulid(),
            UpdatedAt: utc()
        });
        expect(childMessage.State.Content).toEqual('X');
        expect(childMessage.State.ContextURI).toEqual(message.State.SubContextURI);
    }

    @test()
    public async UpdateText() {
        const context = await this.GetRootContext();
        const message = context.Messages[0];
        message.State = {
            ...message.State,
            Content: 'Hello!'
        };
        expect(context.Messages[0].State.Content).toEqual('Hello!');
    }


    @test()
    public async CreateCycleSubTree() {
        const context = await this.GetRootContext();
        const message = context.Messages[0];
        await message.Actions.Attach(context.State.URI);
        expect(message.SubContext === context).toBeTruthy();
    }

    after() {
        clearMocks();
    }
}

