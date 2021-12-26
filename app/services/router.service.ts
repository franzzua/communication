import {distinctUntilChanged, filter, Injectable, map} from "@hypertype/core";
import {Router} from "@hypertype/app";

@Injectable()
export class RouterService{

    constructor(private router: Router) {
    }


    toContext(contextURI: string){
        const uri = encodeURIComponent(btoa(contextURI).replaceAll('=',''));
        this.router.Actions.navigate('context', {uri});
    }

    public ContextURI$ = this.router.State$.pipe(
        filter(x => x.name == 'context'),
        map(x => x.params.get('uri')),
        distinctUntilChanged(),
        map(decodeURIComponent),
        map(atob)
    );
}