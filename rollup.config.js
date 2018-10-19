import localResolve from "rollup-plugin-local-resolve";

module.exports = {
    input: 'src/index.js',
    plugins: [localResolve()],
    output: [
        {
            file: 'dist/budibase-core.cjs.js',
            format: 'cjs',
            sourcemap: 'inline'
        },
        {
            file: 'dist/budibase-core.esm.js',
            format: 'esm',
            sourcemap: 'inline'
        },
        {
            file: 'dist/budibase-core.umd.js',
            format: 'umd',
            name: "budibase-core",
            sourcemap: 'inline'
        },
    ]
  };