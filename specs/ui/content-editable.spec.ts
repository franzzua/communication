import {describe, expect, test} from "@jest/globals";
import {Fn} from "@cmmn/core";
import {TestApp} from "./entry/test-app";
import {DomainProxy, IContextProxy} from "../../proxy";
import {ExtendedElement} from "@cmmn/ui";
import {EditorComponent} from "../../ui/editor/editor.component";
import {DomainProxyMock} from "./mocks/domain-proxy.mock";
import {MessageProxyMock} from "./mocks/message-proxy.mock";
import {ContextProxyMock} from "./mocks/context-proxy.mock";
import {EditorCollection} from "../../ui/editor/editor-collection";

const wait = () => Fn.asyncDelay(5);

async function getContext(id: string) {
    console.log('-----------' + id + '----------');
    EditorComponent.DebounceTime = 1;
    const app = await TestApp.Build();
    const proxy = app.cont.get<DomainProxyMock>(DomainProxy);
    const context = proxy.ContextsMap.get('test');
    const comp = document.createElement('ctx-editor') as ExtendedElement<EditorComponent>;
    comp.setAttribute('id', id);
    comp.setAttribute('uri', 'test');
    document.body.appendChild(comp);
    // To apply initial state from mock model
    await wait();
    const ce = comp.querySelector('[contenteditable]') as HTMLDivElement;
    return {app, context, ce};
}

type DeepArray<T> = Array<T | DeepArray<T>>;

function checkContext(context: IContextProxy, array: DeepArray<number>){
    array = array.slice();
    console.log(context.Messages.map(x => x.State.Content));
    for (let i = 0; i < context.Messages.length; i++){
        let message = context.Messages[i];
        expect(+message.State.Content).toEqual(+array[i]);
        if (message.SubContext && Array.isArray(array[i + 1])){
            checkContext(message.SubContext, array.splice(i + 1, 1)[0] as DeepArray<number>);
        }
    }
}
function checkUI(ce: ExtendedElement<EditorComponent>, array: DeepArray<number>) {
    expect(Array.from(ce.childNodes).map(x => x.textContent)).toEqual(array.flat(Number.POSITIVE_INFINITY).map(x => x.toString()));
}
function checkContent(ce: ExtendedElement<EditorComponent>, context: ContextProxyMock, array: DeepArray<number>) {
    console.log(Array.from(ce.childNodes).map(x => x.textContent))
    // checkContext(context, array.slice());
    checkUI(ce, array.slice())
}

test('initial', async () => {
    const {ce, context, app} = await getContext('initial');
    checkContent(ce, context, [1, 2, [3]]);
    ce.remove();
    app.destroy();
});
describe('model', () => {

    test('update', async () => {
        const {ce, context, app} = await getContext('update');
        await context.Messages[0].UpdateContent('8');
        await wait();
        expect(ce.children[0].innerHTML).toEqual('8');
        ce.remove();
        app.destroy();
    })

    test('remove', async () => {
        const {ce, context, app} = await getContext('remove');
        context.messages.removeAt(1);
        await wait();
        expect(ce.children.map(x => +x.innerHTML)).toEqual([1]);
        ce.remove();
        app.destroy();
    });

    test('add', async () => {
        const {ce, context, app} = await getContext('add');
        context.messages.insert(1, new MessageProxyMock(context, '5'));
        await wait();
        expect(ce.children.map(x => +x.innerHTML)).toEqual([1, 5, 2, 3]);
        ce.remove();
        app.destroy();
    });


    test('move', async () => {
        const {ce, context, app} = await getContext('move');
        const x = context.messages.toArray()[1];
        context.messages.removeAt(1);
        context.messages.insert(0, x);
        await wait();
        checkContent(ce, context, [2, [3], 1]);
        ce.remove();
        app.destroy();
    });


    test('mirrors', async () => {
        const {ce, context, app} = await getContext('add');
        context.Messages[0].SubContext = context.Messages[1].SubContext;
        await wait();
        checkContent(ce, context, [1,[3],2,[3]]);
        context.Messages[0].SubContext.Messages[0].UpdateContent('5');
        // await wait();
        // checkContent(ce, context, [1,5,2,5,3]);
        // context.Messages[0].SubContext.Messages[0].SubContext = new ContextProxyMock([6]);
        // await wait();
        // checkContent(ce, context, [1,5,6,2,5,6,3]);
        ce.remove();
        app.destroy();
    });
    test('infinity', async () => {
        const {ce, context, app} = await getContext('add');
        context.Messages[0].SubContext = context;
        await wait();
        const result = context.serialize(EditorCollection.MaxDepth);
        checkContent(ce, context, result);
        ce.remove();
        app.destroy();
    });
})


describe('ui', () => {

    test('update', async () => {
        const {ce, context, app} = await getContext('update');
        ce.children[0].innerHTML = '4';
        ce.dispatchEvent(new Event('input', {bubbles: true}))
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
        ce.dispatchEvent(new Event('input', {bubbles: true}));
        await wait();
        checkContent(ce, context, [1, 2, [3, 5]]);
        ce.remove();
        app.destroy();
    })

    test('add-subitem', async () => {
        const {ce, context, app} = await getContext('add');
        global.setSelection({
            type: 'Caret',
            anchorNode: ce.children[0]
        });
        const item2 = ce.children[1];
        const item3 = ce.children[2];
        const child = document.createElement('span');
        child.innerHTML = '5';
        child.style.order = '3';
        ce.insertBefore(child, item2);
        const child2 = document.createElement('span');
        child2.innerHTML = '6';
        child2.style.order = '3';
        ce.insertBefore(child2, item3);
        checkUI(ce, [1, 5, 2, 6, [3]]);
        ce.dispatchEvent(new Event('input', {bubbles: true}));
        await wait();
        checkContent(ce, context, [1, 5, 2, [6, 3]]);
        ce.remove();
        app.destroy();
    })
    test('add-first', async () => {
        const {ce, context, app} = await getContext('add-first');
        const child = document.createElement('span');
        child.innerHTML = '7'
        ce.insertBefore(child, ce.children[0]);
        ce.dispatchEvent(new Event('input', {bubbles: true}));
        await wait();
        checkContent(ce, context, [7,1,2,3]);
        ce.remove();
        app.destroy();
    })
    test('remove', async () => {
        const {ce, context, app} = await getContext('remove');
        ce.children[0].remove();
        ce.dispatchEvent(new Event('input', {bubbles: true}));
        await wait();
        checkContent(ce, context, [2,3]);
        ce.remove();
        app.destroy();
    })

    test('move down', async () => {
        const {ce, context, app} = await getContext('move');
        global.setSelection({
            type: 'Caret',
            anchorNode: ce.children[0]
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
        checkContent(ce,context, [2, [3], 1]);
        ce.remove();
        app.destroy();
    })


    test('move up', async () => {
        const {ce, context, app} = await getContext('move');
        global.setSelection({
            type: 'Caret',
            anchorNode: ce.children[1],
            setBaseAndExtent(){}
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
        checkContent(ce,context, [2,[3],1]);
        ce.remove();
        app.destroy();
    })


    test('move right and left', async () => {
        const {ce, context, app} = await getContext('move');
        global.setSelection(getCaretSelection(ce.children[2]));
        ce.dispatchEvent(new Event('selectionchange', {
            bubbles: true
        }));
        ce.dispatchEvent(new KeyboardEvent('keydown', {
            code: 'Tab',
            bubbles: true
        } as any))
        await wait();
        checkContent(ce,context, [1,2,3]);
        // expect(ce.children[2].style.getPropertyValue('--level')).toEqual('2');
        // expect(ce.component.Selection.Focus.item.item.State.Content).toEqual('3');

        ce.dispatchEvent(new KeyboardEvent('keydown', {
            shiftKey: true,
            code: 'Tab',
            bubbles: true
        } as any));
        await wait();
        checkContent(ce,context, [1,2,3]);
        // expect(ce.children[2].style.getPropertyValue('--level')).toEqual('1');
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