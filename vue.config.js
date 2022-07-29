const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  devServer: {
    port: 9999
  },
  productionSourceMap: false,
  lintOnSave: false
})
