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
    private storageURI = 'local://default';

    constructor() {
    }

    async before() {
    }

    private async GetRootModel() {
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
        return context;
    }

    @test()
    public async MessageOrdering() {
        const context = await this.GetRootModel();
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
    }

}

