var loaders = [
    { test: /\.css$/, loader: "style-loader!css-loader" },
    { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
    { test: /\.json$/, loader: "json-loader" },
    // jquery-ui loads some images
    { test: /\.(jpg|png|gif)$/, loader: "file" },
    // required to load font-awesome
    { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
    { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/font-woff" },
    { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=application/octet-stream" },
    { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
    { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&mimetype=image/svg+xml" }
];

var buildExtension = require('jupyterlab-extension-builder/lib/builder').buildExtension;

buildExtension({
  name: 'bqplot',
  entry: './src/labplugin',
  outputDir: '../bqplot/staticlab',
  config: {
    module: {
      loaders: [
          { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
        ]
    }
  }
});


module.exports = [
    {// Notebook extension
        entry: './src/extension.js',
        output: {
            filename: 'extension.js',
            path: '../bqplot/static',
            libraryTarget: 'amd'
        }
    },
    {// bqplot bundle for the notebook
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: '../bqplot/static',
            libraryTarget: 'amd'
        },
        devtool: 'source-map',
        module: {
            loaders: loaders
        },
        externals: ['jupyter-js-widgets']
    },
    {// embeddable bqplot bundle
        entry: './src/index.js',
        output: {
            filename: 'index.js',
            path: './dist/',
            libraryTarget: 'amd'
        },
        devtool: 'source-map',
        module: {
            loaders: loaders
        },
        externals: ['jupyter-js-widgets']
    }
];
