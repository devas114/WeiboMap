var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var sassLoaders = [
    "css-loader?importLoaders=1",
    "postcss-loader",
    "sass-loader?includePaths[]=" + path.join(__dirname, "app", "sass")
];

module.exports = {
    entry: {
        main: ["./src/javascript/index.js"],
        intro: ["./src/javascript/instruction.js"]
    },
    output: {
        path: path.join(__dirname, "./dist/javascript"),
        filename: "[name].bundle.js",
    },
    module: {
        loaders: [
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(
                    "style-loader",
                    sassLoaders.join("!")
                )
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            d3: path.join(__dirname, "./src/javascript/d3.v3.min.js"),
            Papa: path.join(__dirname, "./src/javascript/papaparse.min.js")
        }),
        new ExtractTextPlugin("../stylesheet/[name].bundle.css")
    ],
    postcss: function() {
        return [
            require("precss"),
            require("autoprefixer")
        ];
    },
    resolve: {
        extensions: ["", ".js", ".scss", ".sass"],
        root: [path.join(__dirname, "./src")]
    }
}
