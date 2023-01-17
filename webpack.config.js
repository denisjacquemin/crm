const path = require("path");
const glob = require("glob");

module.exports = {
    entry: glob.sync(path.join(__dirname, "public", "**", "!(alpine*)", "*.js"))
        .concat(glob.sync(path.join(__dirname, "src", "views", "**", "*.js"))),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "bundle.js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader"
            }
        }]
    }
};