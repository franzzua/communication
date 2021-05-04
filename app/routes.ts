export const Routes = [
    {name: 'root', path: '/', forwardTo: '/context/root'},{
        name: 'crdt',
        path: '/crdt',
        template: (html, params) => html`<ctx-crdt></ctx-crdt>`
    },
    {
        name: 'context',
        path: '/context/*uri',
        template: (html, params) => html`<ctx-context uri=${atob(decodeURIComponent(params.uri))}></ctx-context>`
    },
    {
        name: 'concord',
        path: '/concord',
        template: (html, params) => html`<ctx-concord></ctx-concord>`
    },
    {
        name: 'tree',
        path: '/tree/*uri',
        template: (html, params) => html`<ctx-tree uri=${atob(decodeURIComponent(params.uri))}></ctx-tree>`
    },{
        name: 'dev-tree',
        path: '/dev/tree/*uri',
        template: (html, params) => html`<ctx-tree uri=${atob(decodeURIComponent(params.uri))}></ctx-tree>`
    },
    {
        name: 'Storage',
        path: '/storage/:uri',
        template: (html, params) =>html`<storage-page uri=${params.uri}></storage-page>`
    },
    {
        name: 'Settings',
        path: '/settings/:uri',
        template: (html, params) =>html`<ctx-settings uri=${params.uri}></ctx-settings>`
    }
]
