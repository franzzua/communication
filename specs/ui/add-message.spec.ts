import {test} from "@jest/globals";
import {DOMParser, parseHTML} from 'linkedom';
import {Fn} from "@cmmn/core";
import {TestApp} from "./entry/test-app";

TestApp.Build();

test('add-message', async () => {
    const ce = document.querySelector('content-editable');
    await Fn.asyncDelay(100);
    console.log(ce.childNodes);
})