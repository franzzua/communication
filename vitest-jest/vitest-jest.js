#!/usr/bin/env node

console.log(...process.argv);
process.argv = [
    process.argv[0],
    process.argv[1],
    process.argv.pop()
];
import('vitest/dist/cli.js')
