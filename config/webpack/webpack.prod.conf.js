const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const baseWebpackConfig = require("./webpack.base.conf");
const webpackFile = require('./webpack.file.conf');
const entry = require("./webpack.entry.conf");
const webpackCom = require("./webpack.com.conf");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")

let config = merge(baseWebpackConfig, {
  output: {
    path: path.resolve(webpackFile.proDirectory),
    filename: 'js/[name].[chunkhash:8].js',
    chunkFilename: "js/[name]-[id].[chunkhash:8].js",
  },
  plugins: [
    // 设置生产环境
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      }
    }),
    // extract css into its own file
    new ExtractTextPlugin('css/[name].[hash:8].css'),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorOptions: {
        discardComments: {
          removeAll: true
        },
        // 避免 cssnano 重新计算 z-index
        safe: true
      },
      canPrint: true
    })
  ],
  optimization: {
    minimizer: [
      // js mini
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: false // set to true if you want JS source maps
      }),
      // css mini
      new OptimizeCSSPlugin({})
    ],
    splitChunks: {
      chunks: 'async',
      minSize: 30000, // chunk只有超过这个大小才会被分割
      maxSize: 0, // 大于这个体积的chunk会被自动分割为更小的chunk
      minChunks: 1, // 一个模块被共享的chunk数量大于minChunks时，才会被分割出来
      maxAsyncRequests: 5, // 按需加载最大的并行数
      maxInitialRequests: 3, // 初始加载最大的并行数
      automaticNameDelimiter: '~', // name为true时，新chunk的文件名由cacheGroups的key加上chunks属性的一些信息生成，automaticNameDelimiter是分隔符
      name: true,
      cacheGroups: { // 配置拆分规则，会继承splitChunks所有的配置项，所有splitChunks配置项都可以在这里重写覆盖，test、prioprity、reuseExistingChunk是cacheGroups独有的属性
        vendors: {
          test: /[\\/]node_modules[\\/]/, // 模块匹配规则，可以是正则表达式或者函数，不写默认选择所有模块
          priority: -10 // 优先级，当同一个模块同时包含在不同cacheGroup中，该模块将被划分到优先级高的组中
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true // 如果该chunk包含的modules都已经另一个被分割的chunk中存在，那么直接引用已存在的chunk，不会再重新产生一个
        }
      }
    }
  },
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(css|less)$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!less-loader"
        })
      },
      {
        test: /\.(png|jpg|gif|ttf|eot|woff|woff2|svg)$/,
        loader: 'url-loader?limit=8192&name=[name].[hash:8].[ext]&publicPath=' + webpackFile.resourcePrefix + '&outputPath=' + webpackFile.resource + '/'
      },
      {
        test: /\.swf$/,
        loader: 'file?name=js/[name].[ext]'
      }
    ]
  }
});
let pages = entry;
for (let chunkName in pages) {
  let conf = {
    filename: chunkName + '.html',
    template: 'index.html',
    inject: true,
    title: webpackCom.titleFun(chunkName, pages[chunkName][1]),
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true
    },
    chunks: ['manifest', 'vendor', 'common', chunkName],
    hash: false,
    chunksSortMode: 'dependency'
  };
  config.plugins.push(new HtmlWebpackPlugin(conf));
}
/* 清除 pc */
config.plugins.push(webpackFile.cleanFun([webpackFile.proDirectory]));
/* 拷贝静态资源  */
webpackFile.copyArr.map(function (data) {
  return config.plugins.push(data)
});
module.exports = config;