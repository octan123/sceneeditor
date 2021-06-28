const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 生成html模板
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { getThemeVariables } = require('antd/dist/theme');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-source-map',
  node: {
    fs: 'empty'
  },
  entry: {
    home: './src/index.js'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          attributes: {
            list: [
              { tag: 'link', attribute: 'href', type: 'srcset' }
            ]
          }
        }
      },
      //图片加载器，雷同file-loader，更适合图片，可以将较小的图片转成base64，减少http请求
      {
        test: /\.(ico)$/,
        loader: 'url-loader',
        options: {
          limit: 50,
          name: 'config/images/[name].[ext]'//相对于path的路径
        }
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
      {
        test: /\.less$/,
        use: [ // compiles Less to CSS
          'style-loader',
          'css-loader',
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                modifyVars: getThemeVariables({
                  // dark: true, // 开启暗黑模式
                  // compact: true, // 开启紧凑模式
                }),
                javascriptEnabled: true,
              }
            }
          }]
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.m?js$/,
        exclude: /node_modules|public/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  devServer: { // 配置webpack-dev-server， 在本地启动一个服务器运行
    host: '0.0.0.0', // 服务器的ip地址 希望服务器外可以访问就设置 0.0.0.0
    port: 9999, // 端口
    // open: 'google chrome', // 自动打开页面
    historyApiFallback: true,
    proxy: {
      '/nodeapi': {
        target: 'http://localhost:9090/',
        changeOrigin: true,
        pathRewrite: { '^/nodeapi': '' }
      },
     
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 20000,
      
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      name: true,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },

  plugins: [
    
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, 'dist/index.html'), // 生成的html文件存放的地址和文件名
      template: path.resolve(__dirname, 'public/index.html'), // 基于index.html模板进行生成html文件
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static'), // 不打包直接输出的文件
          to: 'static' // 打包后静态文件放置位置
        }
      ]
    })

  ],
  resolve: {
    alias: {
      '@src': path.resolve('src')
    }
  }
};
