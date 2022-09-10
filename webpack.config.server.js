const path = require('path');
const nodeExternals = require("webpack-node-externals")

module.exports = {
    mode: 'production',
    entry: './src/server.ts',
    target: 'node',
    externals: [
        nodeExternals(),
        //{ 'sqlite3':'commonjs sqlite3', }
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: [
                    /public/
                ]
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
        modules: ["node_modules"]
    },
    output: {
        filename: 'server.js',
        path: path.resolve(__dirname)
    },
    optimization:{
        minimize: false
    }
};