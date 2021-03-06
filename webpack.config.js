const { ProvidePlugin } = require('webpack');
const BundleTracker = require('./webpack-ext/bundler-tracker');

module.exports = {
  mode: "development",
  cache: false,
  entry: {
    'main': "./static/ts/main.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?|\.jsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$|\.css$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: "[name]-[fullhash:16].css"
            }
          },
          'extract-loader',
          "css-loader",
          "resolve-url-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
            },
          },
        ]
      },
      {
        test: /\.eot$|\.svg$|\.ttf$|\.woff$|\.woff2$|\.png$|\.gif$/,
        use: {
          loader: 'file-loader',
          options: {
            name: "[name]-[contenthash].[ext]"
          }
        },
      }
    ]
  },
  plugins: [
    new BundleTracker({ filename: './webpack-stats.json' }),
    new ProvidePlugin({ adapter: ['webrtc-adapter', 'default'] })
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.scss', '.css']
  },
  output: {
    filename: "[name]-[fullhash:16].js",
    path: __dirname + "/static/dist/",
    publicPath: '/static/dist/',
    clean: true,
  }
};
