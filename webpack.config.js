const path = require("path");
const glob = require("glob");

const jsEntry = glob.sync(path.join(__dirname, 'src', 'js', '**', '*.js'));
const viewsEntry = glob.sync(path.join(__dirname, 'src', 'views', '**', '*.js'));
// const alpineVendorEntry = [
// //   path.join(__dirname, 'src', 'lib', 'vendor', 'alpine', 'alpine-mask@0.2.0.min.js'),
//   path.join(__dirname, 'src', 'lib', 'vendor', 'alpine', 'alpine.3.10.5.min.js'),
// ];

module.exports = {
    entry: {
        app: viewsEntry.concat(jsEntry)
    },
    output: {
        path: path.join(__dirname, "public"),
        filename: "[name].bundle.js" // Use [name] to dynamically generate unique filenames
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
