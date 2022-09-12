const path = require('path');
const webpack = require('webpack');
const nodeExternals = require("webpack-node-externals")

module.exports = {
    mode: 'production',
    entry: './src/server.ts',
    target: 'node',
    externals: [
        nodeExternals()
    ],
    plugins:[
        new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/db\/sqlite$/,
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader"
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