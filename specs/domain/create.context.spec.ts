import '../polyfills';
import {expect, suite, test,} from '@cmmn/tools/test';
import {clearMocks, getTestContainer} from "../container";
import {Fn, utc} from '@cmmn/core';
import {DomainLocator} from "@domain/model/domain-locator.service";
import {ContextModel, MessageModel} from "@domain/model";
import {Context, Message} from "@model";
import {IContextActions, IMessageActions} from "@domain";
import {Permutation} from "@domain/helpers/permutation";
import {DomainProxy} from "@services";
import {Container} from "@cmmn/core";
import {Cell} from "@cmmn/cell/dist/typings";

@suite()
export class CreateContextSpec {
    private storageURI = 'local://default';
    private container: Container;

    constructor() {
    }

    async before() {
        this.container = getTestContainer();
    }

    private async GetRootContext() {
        const domainProxy = this.container.get<DomainProxy>(DomainProxy);
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
    public async Permutation() {
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
    public async AddMessage() {
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

    @test()
    public async MoveMessage() {
        const context = await this.GetRootContext();
        expect(context.State.Messages).toHaveLength(1);
        const message = context.Messages[0];
        const m1 = message.AddMessage({
            Content: 'X',
            CreatedAt: utc(),
            id: Fn.ulid(),
            UpdatedAt: utc()
        });
        await Promise.resolve();
        expect(message.State.SubContextURI).not.toBeNull();
        expect(message.SubContext.Messages).toHaveLength(1);
        expect(context.State.Messages).toHaveLength(1);
        const m11 = m1.MoveTo(context, 0);
        expect(context.State.Messages).toHaveLength(2);
        expect(context.Messages).toHaveLength(2);
        expect(message.SubContext.Messages).toHaveLength(0);
        const m2 = await message.AddMessage({
            Content: 'Y',
            CreatedAt: utc(),
            id: Fn.ulid(),
            UpdatedAt: utc()
        });
        m2.MoveTo(m11.GetOrCreateSubContext());
        expect(m11.SubContext.Messages).toHaveLength(1);
        expect(message.SubContext.Messages).toHaveLength(0);
        expect(context.Messages).toHaveLength(2);
    }

    after() {
        clearMocks();
    }
}

