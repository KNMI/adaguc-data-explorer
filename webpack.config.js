/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/application/index.tsx',
  cache: { type: 'memory' },
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'adaguc-data-explorer.js',
    hashFunction: 'sha256',
  },
  devtool: 'eval-cheap-module-source-map',
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    fallback: {
      fs: false,
      net: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /(node_modules|dist)/,
        use: ['babel-loader'],
      },
      // {
      //   test: /\.html$/,
      //   use: [
      //     {
      //       loader: 'html-loader',
      //       options: { minimize: false },
      //     },
      //   ],
      // },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './src/application/index.html',
      filename: './index.html',
    }),
  ],
  devServer: {
    hot: true,
  },
  watchOptions: {
    ignored: /node_modules/,
  },
};
