import localResolve from "rollup-plugin-local-resolve";
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

const lodash_fp_exports = ["union", "reduce", "isUndefined", "cloneDeep", "split", "some", "map", "filter", "isEmpty", "countBy", "includes", "last", "find", "constant", 
"take", "first", "intersection", "mapValues", "isNull", "has", "isNumber", "isString", "isBoolean", "isDate", "isArray", "isObject", "clone", "values", "keyBy", 
"keys", "orderBy", "concat", "reverse", "difference", "merge", "flatten", "each", "pull", "join", "defaultCase", "uniqBy", "every", "uniqWith", "isFunction", "groupBy", 
"differenceBy", "intersectionBy", "isEqual"];

const lodash_exports = ["toNumber", "flow", "isArray", "join", "replace", "trim", "dropRight", "takeRight", "head", "isUndefined", "isNull", "isNaN", "reduce", "isEmpty", 
"constant", "tail", "includes", "startsWith", "findIndex", "isInteger", "isDate", "isString", "split", "clone", "keys", "isFunction", "merge", "has", "isBoolean", "isNumber", 
"isObjectLike", "assign", "some", "each", "find", "orderBy", "union"];

module.exports = {
    input: 'src/index.js',
    output: [
        {
            file: 'dist/budibase-core.cjs.js',
            format: 'cjs',
            sourcemap: 'inline'
        },
        /*{
            file: 'dist/budibase-core.iife.js',
            format: 'iife',
            sourcemap: 'inline',
            globals: [

            ]
        }*/,
        {
            file: 'dist/budibase-core.esm.mjs',
            format: 'esm',
            sourcemap: 'inline'
        },
        {
            file: 'dist/budibase-core.umd.js',
            format: 'umd',
            name: "budibase-core",
            sourcemap: 'inline'
        }
    ],
    plugins: [
        resolve(),
        commonjs({
            namedExports: {
                "lodash/fp": lodash_fp_exports,
                "lodash":lodash_exports,
                "shortid": ["generate"]
            }
        })
    ]
  };

  