const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin")

module.exports = {
    mode: 'production',
    entry: './src/client/index.tsx',
    plugins: [
        new HtmlWebpackPlugin({
          template: 'resource/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'resource/static' }
            ]
        }),
    ],
    module: {
        rules: [
            {
                loader: 'ts-loader',
                test: /\.tsx?$/,
                exclude: [
                    /node_modules/
                ],
                options: {
                    configFile: 'tsconfig.json'
                }
            }
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'static/js/[name].bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    optimization:{
        splitChunks: {
            name: 'vendor',
            chunks: 'initial',
        }
    }
};