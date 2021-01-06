export const Routes = [
    {name: 'root', path: '/', forwardTo: '/context/root'},
    {
        name: 'context',
        path: '/context/:uri',
        template: (html, params) =>html`<ctx-context uri=${params.uri}></ctx-context>`
    },
    {
        name: 'Storage',
        path: '/Storage/:uri',
        template: (html, params) =>html`<Storage-page uri=${params.uri}></Storage-page>`
    }
]