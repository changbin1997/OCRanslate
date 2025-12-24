const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  devServer: {
    port: 38527
  },
  productionSourceMap: false,
  lintOnSave: false
})
