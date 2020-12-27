export const Routes = [
    {name: 'root', path: '/', forwardTo: '/context/root'},
    {
        name: 'context',
        path: '/context/:uri',
        template: (html, params) =>html`<ctx-context uri=${params.uri}></ctx-context>`
    }
]