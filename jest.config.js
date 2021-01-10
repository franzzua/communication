// jest.config.js
const {pathsToModuleNameMapper} = require('ts-jest/utils');
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const {compilerOptions} = require('./tsconfig');


module.exports = {
    transform: {
        "^.+\\.jsx?$": "babel-jest",
        "^.+\\.tsx?$": "ts-jest"
    },
    testEnvironment: 'jest-environment-node',
    globals: {
        'ts-jest': {
            compiler: 'typescript',
            tsconfig: './specs/tsconfig.json'
        }
    },
    transformIgnorePatterns: [],
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>/'}),
        '^solidocity': '<rootDir>/node_modules/solidocity/dist/node.js',
        '^@hypertype\/infr':'<rootDir>/node_modules/@hypertype/infr/dist/index.js',
    }
};