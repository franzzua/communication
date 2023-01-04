import {IRouterOptions, Route} from "@cmmn/app";

export const Routes: (Route & {
    template?: (html, params) => any
})[] = [
    {name: 'root', path: '/', forwardTo: 'init'},
    {
        name: 'crdt',
        path: '/crdt',
        template: (html, params) => html`
            <ctx-crdt></ctx-crdt>`
    },
    {
        name: 'sparql',
        path: '/sparql',
        template: html => html`
            <ctx-sparql></ctx-sparql>`
    },
    {
        name: 'init',
        path: '/init',
        template: (html, params) => html`
            <app-init></app-init>`
    },
    {
        name: 'context',
        path: '/context/*uri',
        template: (html, params) => html`
            <div style="display: flex; flex-flow: column nowrap; flex: 1;">
                <content-editable style="flex: 1" uri=${params.uri ? atob(decodeURIComponent(params.uri)) : null}/>
            </div>
        `
    },
    {
        name: 'concord',
        path: '/concord',
        template: (html, params) => html`
            <ctx-concord></ctx-concord>`
    },
    {
        name: 'tree',
        path: '/tree/*uri',
        template: (html, params) => html`
            <ctx-tree uri=${atob(decodeURIComponent(params.uri))}></ctx-tree>`
    }, {
        name: 'dev-tree',
        path: '/dev/tree/*uri',
        template: (html, params) => html`
            <ctx-tree uri=${atob(decodeURIComponent(params.uri))}></ctx-tree>`
    },
    {
        name: 'Storage',
        path: '/storage/:uri',
        template: (html, params) => html`
            <storage-page uri=${params.uri}></storage-page>`
    },
    {
        name: 'Settings',
        path: '/settings/:uri',
        template: (html, params) => html`
            <ctx-settings uri=${params.uri}></ctx-settings>`
    }
]
