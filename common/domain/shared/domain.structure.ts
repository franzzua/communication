import {ModelKey, ModelPath} from "./types";
import {ModelProxy} from "../modelProxy";
import {ModelMap} from "../model-map";
import {Fn} from "@cmmn/core";


type DefMapping = {
    type: 'array' | 'map' | 'link';
    model: Function;
    key: (x: any) => ModelKey | ModelKey[];
    id?: string;
}
type Def<TModel = any> = {
    instances: Map<string, ModelProxy<TModel, any>>;
    mappings: DefMapping[];
    root?: boolean;
    model: Function;
    target: {
        new(stream, path): ModelProxy<TModel, any>
    };
    getPath?: (key: ModelKey, self: ModelProxy<any, any>) => ModelPath;
};
export type StructureInfo = {
    type: 'array' | 'map' | 'link';
    to: Structure | string;
    key?: 'string';
}
export type Structure = {
    [key: string]: StructureInfo;
};
const definitions = new Map<Function, Def>();
const defaultDef = () => ({mappings: [], root: false, instances: new Map()} as Def);

export function getRootProxy(): ConstructorOf<ModelProxy<any, any>> {
    for (let [key, definition] of definitions) {
        if (!definition.root)
            continue;
        return key as ConstructorOf<ModelProxy<any, any>>;
    }
    // const rootDef = (() => {
    //     for (const def of definitions.values()) {
    //         if (def.root)
    //             return def;
    //     }
    // })();
    // return getStructure(rootDef, ['Root']) as Structure;
}

// function getStructure(def: Def, path: ModelPath): Structure | string {
//     if (!def)
//         debugger;
//     if (def.path) {
//         return def.path.slice(0, -1).join(':');
//     }
//     def.path = path;
//     const result = {};
//     for (const mapping of def.mappings) {
//         const targetStructure = getStructure(definitions.get(mapping.target()), [...path, mapping.id, '*']);
//         result[mapping.key ?? mapping.id] = {
//             type: mapping.type,
//             to: targetStructure,
//             key: mapping.id
//         };
//     }
//     return result;
// }

type ConstructorOf<T> = {
    new(...args): T;
};

function getDefinition(model) {
    let definition: Def<any>;
    for (const def of definitions.values()) {
        if (def.model === model) {
            definition = def;
        }
    }
    return definition;
}

export namespace proxy {

    export const of = <TModel>(model: {
        new(...args): TModel;
    }, getPath?: (key: ModelKey, self: ModelProxy<any, any>) => ModelPath): ClassDecorator => {
        return target => {
            const def = definitions.getOrAdd(target, defaultDef);
            def.model = model;
            def.target = target as any;
            def.getPath = getPath;
            def.root = !getPath;
        }
    }

    export const map = <TModel>(
        model: ConstructorOf<any>,
        getKeys: (model: TModel) => ModelKey[]
    ): PropertyDecorator => (target, propertyKey) => {
        Object.defineProperty(target, propertyKey, {
            get(this: ModelProxy<TModel, any>) {
                const definition = getDefinition(model);
                // @ts-ignore
                return new ModelMap(this.stream,
                    () => getKeys(this.State),
                    id => {
                        const path = definition.getPath(id, this);
                        return definition.instances.getOrAdd(path.join(':'), () =>
                            new definition.target(this.stream, path));
                    });
            }
        });
    }
    export const array = <TSource, TTarget>(model: ConstructorOf<TTarget>, key?): PropertyDecorator => (target, propertyKey) => {
        const def = definitions.getOrAdd(target.constructor, defaultDef)
        def.mappings.push({
            type: 'array',
            model,
            key: key,
            id: propertyKey as string
        });
    }
    export const link = <TModel>(
        model: ConstructorOf<any>,
        getKey: (model: TModel) => ModelKey = () => 'Root'
    ): PropertyDecorator => (target, propertyKey) => {
        Object.defineProperty(target, propertyKey, {
            get(this: ModelProxy<TModel, any>) {
                const key = getKey(this.State);
                if (!key) return null;
                const definition = getDefinition(model);
                const path = definition.getPath(key, this);
                return definition.instances.getOrAdd(path.join(':'), () => new definition.target(this.stream, path));
            }
        });
    }
}
