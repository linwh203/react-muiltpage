const webpack = require('webpack'); //引入webpack
const opn = require('opn'); //打开浏览器
const merge = require('webpack-merge'); //webpack配置文件合并
const path = require("path");
const baseWebpackConfig = require("./webpack.base.conf"); //基础配置
const webpackFile = require("./webpack.file.conf"); //一些路径配置
const ExtractTextPlugin = require("extract-text-webpack-plugin");

let config = merge(baseWebpackConfig, {
  output: {
    path: path.resolve(webpackFile.devDirectory),
    filename: 'js/[name].js',
    chunkFilename: "js/[name]-[id].js",
    publicPath: ''
  },
  plugins: [
    /*设置开发环境*/
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      }
    }),
    /*设置热更新*/
    new webpack.HotModuleReplacementPlugin(),
    /*设置css提取*/
    new ExtractTextPlugin("styles.css")
  ],
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        use: [
          'cache-loader',
          'babel-loader',
        ],
        include: [
          path.resolve(__dirname, "../../app"),
          path.resolve(__dirname, "../../entryBuild")
        ],
        exclude: [
          path.resolve(__dirname, "../../node_modules")
        ],
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader",
          publicPath: '../'
        })
      },
      {
        test: /\.less$/,
        loader: 'style-loader!css-loader!postcss-loader!less-loader?sourceMap=true'
      },
      {
        test: /\.(png|jpg|gif|ttf|eot|woff|woff2|svg|swf)$/,
        loader: 'file-loader?name=[name].[ext]&outputPath=' + webpackFile.resource + '/'
      }
    ]
  },
  optimization: {
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
  /*设置api转发*/
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    hot: true,
    inline: true,
    contentBase: path.resolve(webpackFile.devDirectory),
    historyApiFallback: true,
    disableHostCheck: true,
    proxy: [{
      context: ['/api/**', '/u/**'],
      target: 'http://192.168.12.100:8080/',
      secure: false
    }],
    /*打开浏览器 并打开本项目网址*/
    after() {
      opn('http://localhost:' + this.port);
    }
  }
});
module.exports = config;