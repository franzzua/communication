import {describe, expect, test} from "@jest/globals";
import {Fn} from "@cmmn/core";
import {TestApp} from "./entry/test-app";
import {DomainProxy} from "../../proxy";
import {ExtendedElement} from "@cmmn/ui";
import {ContentEditableComponent} from "../../ui/content-editable/content-editable.component";
import {DomainProxyMock} from "./mocks/domain-proxy.mock";
import {MessageProxyMock} from "./mocks/message-proxy.mock";
import {ContextProxyMock} from "./mocks/context-proxy.mock";

const wait = () => Fn.asyncDelay(5);

async function getContext(id: string) {
    console.log('-----------' + id + '----------');
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

test('initial', async () => {
    const {ce, context, app} = await getContext('initial');
    expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual([1, 2, 3]);
    ce.remove();
    app.destroy();
});
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
        expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual([1, 3]);
        ce.remove();
        app.destroy();
    });

    test('add', async () => {
        const {ce, context, app} = await getContext('add');
        context.messages.insert(1, new MessageProxyMock(context, '5'));
        await wait();
        expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual([1, 5, 2, 3]);
        ce.remove();
        app.destroy();
    });


    test('move', async () => {
        const {ce, context, app} = await getContext('move');
        const x = context.messages.toArray()[2];
        context.messages.removeAt(2);
        context.messages.insert(0, x);
        await wait();
        expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual([3, 1, 2]);
        ce.remove();
        app.destroy();
    });
})

function checkContent(ce: ExtendedElement<ContentEditableComponent>, context: ContextProxyMock, array: number[]) {
    expect(context.Messages.map(x => +x.State.Content)).toEqual(array);
    expect(ce.component.childNodes.map(x => +x.innerHTML)).toEqual(array);
}

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

    test('add-selection', async () => {
        const {ce, context, app} = await getContext('add');
        global.setSelection({
            type: 'Caret',
            anchorNode: ce.component.childNodes[0]
        });
        const child = document.createElement('span');
        child.innerHTML = '5';
        child.style.order = '3';
        ce.insertBefore(child, ce.component.childNodes[1]);
        const child2 = document.createElement('span');
        child2.innerHTML = '6';
        child2.style.order = '3';
        ce.insertBefore(child2, ce.component.childNodes[1]);
        ce.dispatchEvent(new Event('input'));
        await wait();
        checkContent(ce, context, [1, 6, 5, 2, 3]);
        ce.remove();
        app.destroy();
    })
    test('add-br', async () => {
        const {ce, context, app} = await getContext('add-br');
        global.setSelection({
            type: null,
        });
        const child = document.createElement('span');
        child.innerHTML = '<br>'
        child.style.order = '1.2'
        ce.insertBefore(child, ce.component.childNodes[2]);
        ce.dispatchEvent(new Event('input'));
        await wait();
        checkContent(ce, context,[1, 0, 2, 3]);
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
        checkContent(ce, context, [2,3]);
        ce.remove();
        app.destroy();
    })

    test('move down', async () => {
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


    test('move up', async () => {
        const {ce, context, app} = await getContext('move');
        global.setSelection({
            type: 'Caret',
            anchorNode: ce.component.childNodes[2]
        });
        ce.dispatchEvent(new Event('selectionchange', {
            bubbles: true
        }));
        ce.dispatchEvent(new KeyboardEvent('keydown', {
            ctrlKey: true,
            code: 'ArrowUp',
            bubbles: true
        } as any))
        await wait();
        expect(context.Messages.map(x => x.State.Content)).toEqual(['1', '3', '2']);
        expect(ce.component.childNodes.map(x => x.innerHTML)).toEqual(['1', '3', '2']);
        ce.remove();
        app.destroy();
    })
})
