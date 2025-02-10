<template>
  <aside>
    <div class="link-box py-2" role="list">
      <router-link :to="{name: 'ocrPage'}" class="mb-2" role="listitem" v-bind:class="{'link-active': $route.name === 'ocrPage'}">
        <i class="icon-home2"></i>
        <span>OCR</span>
      </router-link>
      <router-link :to="{name: 'translationPage'}" class="mb-2" role="listitem" v-bind:class="{'link-active': $route.name === 'translationPage'}">
        <i class="icon-earth"></i>
        <span>翻译</span>
      </router-link>
      <router-link class="mb-2" :to="{name: 'favoritesPage'}" role="listitem" v-bind:class="{'link-active': $route.name === 'favoritesPage'}">
        <i class="icon-star-full"></i>
        <span>收藏</span>
      </router-link>
      <router-link class="mb-2" :to="{name: 'historyPage'}" role="listitem" v-bind:class="{'link-active': $route.name === 'historyPage'}">
        <i class="icon-history"></i>
        <span>历史</span>
      </router-link>
      <router-link :to="{name: 'optionsPage'}" class="mb-2" role="listitem" v-bind:class="{'link-active': $route.name === 'optionsPage' || $route.name === 'tessdataPage'}">
        <i class="icon-cog"></i>
        <span>设置</span>
      </router-link>
      <router-link :to="{name: 'aboutPage'}" role="listitem" v-bind:class="{'link-active': $route.name === 'aboutPage'}">
        <i class="icon-info"></i>
        <span>关于</span>
      </router-link>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'sideBar',
}
</script>

<style scoped>
aside {
  width: 60px;
  height: 100%;
  background: #F9F9F9;
  border-right: 1px solid #EEEEEE;
  display: flex;
  flex: none;
  -webkit-user-select: none;
  user-select: none;
}
aside .link-box {
  width: 100%;
}
aside .link-box a {
  display: block;
  text-align: center;
  text-decoration: none;
  padding: 4px 0;
  color: #636D7E;
  outline: none;
  transition: 0.3s;
}
aside .link-box a:focus {
  color: #2780E3;
}
aside .link-box a:hover {
  color: #2780E3;
}
aside .link-box a i {
  display: block;
  font-size: 25px;
}
aside .link-box a span {
  font-size: 14px;
}
/*侧边栏链接的选中状态*/
.link-active {
  color: #2780E3 !important;
}
</style>