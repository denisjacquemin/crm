const path = require('path');
const glob = require('glob');

const jsEntry = glob.sync(path.join(__dirname, 'src', 'js', '**', '*.js'));
const viewsEntry = glob.sync(path.join(__dirname, 'src', 'views', '**', '*.js'));

// Filter out specific files
const mainEntry = jsEntry.filter((filename) => !filename.includes('src/js/app.js'));
const appEntry = jsEntry.filter((filename) => !filename.includes('src/js/main.js'));

module.exports = {
  entry: {
    app: viewsEntry.concat(appEntry),
    main: [
      path.join(__dirname, 'src', 'js', 'tailwindcss', 'components.js'),
      path.join(__dirname, 'src', 'js', 'main.js'),
    ],
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].bundle.js', // Use [name] to dynamically generate unique filenames
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
