import './polyfills';
import {expect, suite, test, } from '@hypertype/tools/test';
import {DomainService, EventBus, StateService} from "@services";
import {delayAsync, filter, first, utc} from "@hypertype/core";
import {Context, Message} from "@model";
import {YjsRepositoryMock} from "./mocks/yjs-repository.mock";
import {SolidRepositoryMock} from "./mocks/solidRepositoryMock";
import {clearMocks, getTestContainer} from "./container";


@suite()
export class AddMessageSpec {

    constructor() {
    }

    private async GetInstance() {
        const container = getTestContainer();
        const eventBus = container.get<EventBus>(EventBus);
        const state = container.get<StateService>(StateService);
        container.get<DomainService>(DomainService).Actions$.subscribe();
        return {
            eventBus, state
        };
    }

    private async GetInstances() {
        const instance1 = await this.GetInstance();
        const instance2 = await this.GetInstance();
        return {instance1, instance2};
    }

    private getState() {

        const context = {
            URI: 'root',
            Messages: [],
        } as Context;
        const message = {
            Content: '3',
            Context: context,
            CreatedAt: utc(),
            Author: null
        };
        return {context, message};
    }

   @test()
    public async Sync() {
        const {instance1, instance2} = await this.GetInstances();
        expect(instance1.state).not.equals(instance2.state);
        const {context, message} = this.getState();
        await instance1.state.OnCreateContext(context)
        await instance1.state.OnAddMessage(message)
        await this.checkExist(instance2, message)
    }

    @test()
    public async Async() {
        const {instance1, instance2} = await this.GetInstances();
        expect(instance1.state).not.equals(instance2.state);
        const {context, message} = this.getState();
        await instance1.state.OnCreateContext(context)
        await delayAsync(400);
        await instance1.state.OnAddMessage(message)
        await this.checkExist(instance2, message)
        await delayAsync(400);
        const message3 = {
            ...message,
            Content: '4',
            CreatedAt: utc(),
        } as Message;
        await instance2.state.OnAddMessage(message3)
        await this.checkExist(instance1, message3);
    }


    private async checkExist(instance: { eventBus: EventBus, state: StateService }, message: Message) {
        await instance.eventBus.EventStream$.pipe(
            filter(x => x.type == 'OnAddMessage'),
            first()
        ).toPromise();
        const message2 = instance.state.State.get(message.Context.URI).Messages
            .find(x => x.Content == message.Content);
        expect(message2?.CreatedAt?.toISO()).equals(message?.CreatedAt?.toISO());
    }

    after() {
        clearMocks();
    }
}

