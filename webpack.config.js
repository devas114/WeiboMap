var path = require("path");
var webpack = require("webpack");
var sassLoaders = [
    "style-loader",
    "css-loader?importLoaders=1",
    "postcss-loader",
    "sass-loader?includePaths[]=" + path.join(__dirname, "app", "sass")
];

module.exports = {
    entry: {
        main: ["./src/javascript/index.js"],
        intro: ["./src/javascript/instruction.js"],
        cred: ["./src/javascript/credential.js"]
    },
    output: {
        path: path.join(__dirname, "./dist"),
        filename: "[name].bundle.js",
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                loaders: ["style-loader", "css-loader"]
            },
            {
                test: /\.scss$/,
                loaders: ["style-loader", "css-loader", "postcss-loader", "resolve-url-loader", "sass-loader"]
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            d3: path.join(__dirname, "./src/javascript/d3.v3.min.js"),
            Papa: path.join(__dirname, "./src/javascript/papaparse.min.js")
        })
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
