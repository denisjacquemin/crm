## Installation

First, install webpack and webpack-cli as development dependencies in your project by running the following command:

```
npm install --save-dev webpack webpack-cli
```


## webpack.config.js
Create a new file called `webpack.config.js` in the root of your project, where you will configure webpack to bundle and optimize your JavaScript files.
```javascript
module.exports = {
  entry: './src/index.js',
  output: {
    path: __dirname + '/public',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  ...
}
```

# Express.js app
In your express app's index.js, you need to include the webpack bundle and make it public by using middleware, as follows:

```
app.use(express.static('public'));
```

#Scripts
Now you need to setup script in package.json file to build the bundle and watch for changes

```javascript
"scripts": {
    "build": "webpack --mode production",
    "watch": "webpack --watch --mode development"
  },

```

Run the following command to build your JavaScript bundle:
```
npm run build
```

or to automatically rebuild the bundle when changes are made:


```
npm run watch
```

# Serve files from other directory
Also, you can use express.static middleware to serve files from the src/views directory and its subdirectories, like this:

```
app.use(express.static('src/views'));
```
Please note that the above is just a basic setup and webpack could be configured for many more advanced options. Also you may need to configure babel for processing javascript files based on your project requirements.
Also, Keep in mind that it is not recommended to serve javascript files via browser since it may expose security vulnerabilities and it's better to use a build tool such as webpack and serve the files from a folder outside of the project directory.


