export const Routes = [
    {name: 'root', path: '/', forwardTo: '/context/root'},
    {
        name: 'context',
        path: '/context/*uri',
        template: (html, params) => html`<ctx-context uri=${atob(decodeURIComponent(params.uri))}></ctx-context>`
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
