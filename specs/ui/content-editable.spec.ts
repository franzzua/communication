import {describe, expect, test} from "@jest/globals";
import {Fn} from "@cmmn/core";
import {TestApp} from "./entry/test-app";
import {DomainProxy} from "../../proxy";
import {ExtendedElement} from "@cmmn/ui";
import {EditorComponent} from "../../ui/editor/content-editable.component";
import {DomainProxyMock} from "./mocks/domain-proxy.mock";
import {MessageProxyMock} from "./mocks/message-proxy.mock";
import {ContextProxyMock} from "./mocks/context-proxy.mock";
import {EditorCollection} from "../../ui/editor/items-collection";

const wait = () => Fn.asyncDelay(5);

async function getContext(id: string) {
    console.log('-----------' + id + '----------');
    EditorComponent.DebounceTime = 1;
    const app = await TestApp.Build();
    const proxy = app.cont.get<DomainProxyMock>(DomainProxy);
    const context = proxy.ContextsMap.get('test');
    const ce = document.createElement('content-editable') as ExtendedElement<EditorComponent>;
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
        await context.Messages[0].UpdateContent('8');
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
        checkContent(ce, context, [3,1,2]);
        ce.remove();
        app.destroy();
    });


    test('mirrors', async () => {
        const {ce, context, app} = await getContext('add');
        context.Messages[0].SubContext = context.Messages[1].SubContext = new ContextProxyMock([4]);
        await wait();
        checkContent(ce, context, [1,4,2,4,3]);
        context.Messages[0].SubContext.Messages[0].UpdateContent('5');
        await wait();
        checkContent(ce, context, [1,5,2,5,3]);
        context.Messages[0].SubContext.Messages[0].SubContext = new ContextProxyMock([6]);
        await wait();
        checkContent(ce, context, [1,5,6,2,5,6,3]);
        ce.remove();
        app.destroy();
    });
    test('infinity', async () => {
        const {ce, context, app} = await getContext('add');
        const original = context.Messages.map(x => +x.State.Content);
        context.Messages[0].SubContext = context;
        await wait();
        let result = original;
        for (let i = 0; i < EditorCollection.MaxDepth; i++){
            result = [...original.slice(0,1), ...result, ...original.slice(1)];
        }
        console.log(result);
        checkContent(ce, context, result);
        ce.remove();
        app.destroy();
    });
})

function checkContent(ce: ExtendedElement<EditorComponent>, context: ContextProxyMock, array: number[]) {
    expect([...new EditorCollection(context)].map(x => +x.State.Content)).toEqual(array);
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
        global.setSelection(getCaretSelection(null));
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
        checkContent(ce,context, [2,1,3]);
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
        checkContent(ce,context, [1,3,2]);
        ce.remove();
        app.destroy();
    })


    test('move right and left', async () => {
        const {ce, context, app} = await getContext('move');
        global.setSelection(getCaretSelection(ce.component.childNodes[2]));
        ce.dispatchEvent(new Event('selectionchange', {
            bubbles: true
        }));
        ce.dispatchEvent(new KeyboardEvent('keydown', {
            code: 'Tab',
            bubbles: true
        } as any))
        await wait();
        checkContent(ce,context, [1,2,3]);
        expect(ce.component.childNodes[2].style.getPropertyValue('--level')).toEqual('2');
        expect(ce.component.Selection.Focus.item.item.State.Content).toEqual('3');

        ce.dispatchEvent(new KeyboardEvent('keydown', {
            shiftKey: true,
            code: 'Tab',
            bubbles: true
        } as any));
        await wait();
        checkContent(ce,context, [1,2,3]);
        expect(ce.component.childNodes[2].style.getPropertyValue('--level')).toEqual('1');
        ce.remove();
        app.destroy();
    });
})

function getCaretSelection(node: Node){
    return {
        type: node ? 'Caret' : null,
        anchorNode: node,
        focusNode: node,
        anchorOffset: 0,
        focusOffset: 0,
        setBaseAndExtent( focus, focusOffset,anchor, anchorOffset){
            this.focusNode = focus;
            this.anchorNode = anchor;
            this.anchorOffset = anchorOffset;
            this.focusOffset = focusOffset;
        }
    }
}