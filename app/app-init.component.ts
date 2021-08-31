import {Injectable, mapTo, of, switchMap} from "@hypertype/core";
import {Component, HyperComponent} from "@hypertype/ui";
import {DomainProxy} from "@domain";
import {Router} from "@hypertype/app";

@Injectable(true)
@Component({
    name: 'app-init',
    template: html => '',
    style: ''
})
export class AppInitComponent extends HyperComponent{

    constructor(
        private domainProxy: DomainProxy,
        private router: Router
    ) {
        super();
    }

    public Actions$ = of(null).pipe(
        switchMap(() => this.init()),
        mapTo(null)
    );

    private async init() {
        const storage =  await this.domainProxy.Actions.CreateStorage({
            URI: 'local://default',
            Type: 'local',
            Root: null,
            Trash: [],
            Messages: new Map(),
            Contexts: new Map()
        });
        const uri = btoa(storage.URI);
        this.router.Actions.navigate('context', {uri});
    }
}