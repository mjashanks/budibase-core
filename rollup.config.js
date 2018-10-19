import localResolve from "rollup-plugin-local-resolve";

module.exports = {
    input: 'src/index.js',
    plugins: [localResolve()],
    output: [
        {
            file: 'dist/budibase-core.cjs.js',
            format: 'cjs'
        },
        {
            file: 'dist/budibase-core.esm.js',
            format: 'esm'
        },
    ]
  };