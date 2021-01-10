import './polyfills';
import {expect, suite, test,} from '@hypertype/tools/test';
import {EventBus, StateService} from "@services";
import {delayAsync, filter, first, utc} from "@hypertype/core";
import {Context, Message} from "@model";
import {clearMocks, getTestContainer} from "./container";
import {PersistanceService} from "@infr/persistance.service";

@suite()
export class AddMessageSpec {

    constructor() {
    }

    private async GetInstance() {
        const container = getTestContainer();
        const eventBus = container.get<EventBus>(EventBus);
        const state = container.get<StateService>(StateService);
        container.get<PersistanceService>(PersistanceService).Actions$.subscribe();
        container.get<PersistanceService>(StateService).Actions$.subscribe();
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
            id: 'root',
            Messages: [],
        } as Context;
        const message = {
            id: '1',
            Content: '1',
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
        await instance1.eventBus.Notificator.OnCreateContext(context)
        await instance1.eventBus.Notificator.OnAddMessage(message)
        await this.checkExist(instance2, message)
    }

    @test()
    public async Async() {
        const {instance1, instance2} = await this.GetInstances();
        expect(instance1.state).not.equals(instance2.state);
        const {context, message} = this.getState();
        await instance1.eventBus.Notificator.OnCreateContext(context)
        await delayAsync(400);
        await instance1.eventBus.Notificator.OnAddMessage(message)
        await this.checkExist(instance2, message)
        await delayAsync(400);
        const message3 = {
            ...message,
            id: '2',
            Content: '2',
            CreatedAt: utc(),
        } as Message;
        await instance2.eventBus.Notificator.OnAddMessage(message3)
        await this.checkExist(instance1, message3);
    }


    private async checkExist(instance: { eventBus: EventBus, state: StateService }, message: Message) {
        await delayAsync(100);
        // await instance.eventBus.EventStream$.pipe(
        //     filter(x => x.type == 'OnAddMessage'),
        //     first()
        // ).toPromise();
        const existed = instance.state.State.get(message.Context.id).Messages
            .find(Message.equals(message));
        expect(existed?.CreatedAt?.toISO()).equals(message?.CreatedAt?.toISO());
        expect(existed?.Content).equals(message?.Content);
    }

    after() {
        clearMocks();
    }
}

