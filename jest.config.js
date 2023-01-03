import {pathsToModuleNameMapper} from "ts-jest/dist/config/paths-to-module-name-mapper.js";
import "@cmmn/core";
import config from "@cmmn/tools/test/config"
import tsConfig from "./tsconfig.json" assert {type: 'json'}


export default {
    ...config,
    transform: {
        ...config.transform,
        "\.(html|less|style|svg)": "jest-text-transformer",
    },
    moduleFileExtensions: ['ts', 'js', 'less'],
    moduleNameMapper: {
        ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths, {prefix: '<rootDir>/', useESM: true}),
        '@cmmn/domain/proxy': '<rootDir>/node_modules/@cmmn/domain/dist/bundle/proxy.js'
    },
    setupFiles: ['<rootDir>/specs/ui/global.ts']
};