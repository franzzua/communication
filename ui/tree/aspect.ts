import {Observable} from "@hypertype/core";
import {HyperComponent} from "@hypertype/ui";

export class Aspect<TComponent extends HyperComponent = HyperComponent> {
    constructor(protected component: TComponent,
                protected originalState$: Observable<TComponent["State$"]>) {

    }

    public State$: TComponent["State$"];
}

export const aspect = <TComponent extends HyperComponent, TAspect extends Aspect<TComponent>>(aspectClass: {
    new(component, value): TAspect
}) => {
    return ((target, propertyKey: string | symbol) => {
        let aspect: TAspect = null;
        Object.defineProperty(target, propertyKey, {
            get() {
                return aspect[propertyKey];
            },
            set(value) {
                aspect = new aspectClass(this, value);
            }
        })
    }) as PropertyDecorator;
}


