import {describe, it} from "vitest";
import {Injectable} from "@cmmn/core";

export function suite(container?) {
    return function suiteDecorator(target) {
        Injectable(true)(target);
        container.provide([target]);
        const suiteName = target.name;
        describe(suiteName, () => {
            const instance = container ? container.get(target) : new target();
            for (let testName of target[testsSymbols] ?? []) {
                it(testName, instance[testName].bind(instance));
            }
        });
        return target;
    }
}

const testsSymbols = Symbol('tests');

export function test(name?) {
    if (typeof name == "function")
        return test()
    return function testDecorator(target, key, descr) {
        const testName = name ?? key;
        const tests = target.constructor[testsSymbols] ?? (target.constructor[testsSymbols] = []);
        tests.push(testName);
    }
}
