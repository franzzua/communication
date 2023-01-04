import {afterEach, beforeEach, describe, expect, test, jest} from "@jest/globals";
import {Fn} from "@cmmn/core";
import {TestApp} from "./entry/test-app";
import {DomainProxy} from "../../proxy";
import {ExtendedElement} from "@cmmn/ui";
import {ContentEditableComponent} from "../../ui/content-editable/content-editable.component";
import {DomainProxyMock} from "./mocks/domain-proxy.mock";
import {MessageProxyMock} from "./mocks/message-proxy.mock";

const wait = () => Fn.asyncDelay(5);

async function getContext(id: string) {
    ContentEditableComponent.DebounceTime = 1;
    const app = await TestApp.Build();
    const proxy = app.cont.get<DomainProxyMock>(DomainProxy);
    const context = proxy.ContextsMap.get('test');
    const ce = document.createElement('content-editable') as ExtendedElement<ContentEditableComponent>;
    ce.setAttribute('id', id);
    ce.setAttribute('uri', 'test');
    document.body.appendChild(ce);
    // To apply initial state from mock model
    await wait();
    return {app, context, ce};
}

describe('model', () => {

    test('update', async () => {
        const {ce, context, app} = await getContext('update');
        await context.Messages[0].Actions.UpdateText('8');
        await wait();
        expect(ce.component.childNodes[0].innerHTML).toEqual('8');
        ce.remove();
        app.destroy();
    })

    test('remove', async () => {
        const {ce, context, app} = await getContext('remove');
        context.messages.removeAt(1);
        await wait();
        expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual([1,3]);
        ce.remove();
        app.destroy();
    });

    test('add', async () => {
        const {ce, context, app} = await getContext('add');
        context.messages.insert(1, new MessageProxyMock(context, '5'));
        await wait();
        expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual([1,5,2,3]);
        ce.remove();
        app.destroy();
    });
})
describe('ui', () => {

    test('update', async () => {
        const {ce, context, app} = await getContext('update');
        ce.component.childNodes[0].innerHTML = '4';
        ce.dispatchEvent(new Event('input'))
        await wait();
        expect(context.Messages[0].State.Content).toEqual('4');
        ce.remove();
        app.destroy();
    })

    test('add', async () => {
        const {ce, context, app} = await getContext('add');
        const child = document.createElement('span');
        child.innerHTML = '5';
        child.style.order = '3';
        ce.appendChild(child);
        ce.dispatchEvent(new Event('input'));
        await wait();
        expect(context.Messages[3].State.Content).toEqual('5');
        ce.remove();
        app.destroy();
    })
    test('add-first', async () => {
        const {ce, context, app} = await getContext('add-first');
        const child = document.createElement('span');
        child.innerHTML = '7'
        child.style.order = '-1'
        ce.insertBefore(child, ce.component.childNodes[0]);
        ce.dispatchEvent(new Event('input'));
        await wait();
        expect(context.Messages[0].State.Content).toEqual(child.innerHTML);
        ce.remove();
        app.destroy();
    })
    test('remove', async () => {
        const {ce, context, app} = await getContext('remove');
        ce.component.childNodes[0].remove();
        ce.dispatchEvent(new Event('input'));
        await wait();
        expect(context.Messages.length).toEqual(2);
        expect(context.Messages[0].State.Content).toEqual('2');
        expect(context.Messages[1].State.Content).toEqual('3');
        ce.remove();
        app.destroy();
    })

    test('move', async () => {
        const {ce, context, app} = await getContext('move');
        global.setSelection({
            type: 'Caret',
            anchorNode: ce.component.childNodes[0]
        });
        ce.dispatchEvent(new Event('selectionchange', {
            bubbles: true
        }));
        ce.dispatchEvent(new KeyboardEvent('keydown', {
            ctrlKey: true,
            code: 'ArrowDown',
            bubbles: true
        } as any))
        await wait();
        expect(context.Messages.map(x => x.State.Content)).toEqual(['2', '1', '3']);
        expect(ce.component.childNodes.map(x => x.innerHTML)).toEqual(['2', '1', '3']);
        ce.remove();
        app.destroy();
    })
})
