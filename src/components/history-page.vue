<template>
  <div id="history-page">
    <!--标签页切换区域-->
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a href="javascript:;" @click="changePage('overview')" class="nav-link" v-bind:class="{active: page.overview}">记录总览</a>
      </li>
      <li class="nav-item">
        <a href="javascript:;" @click="changePage('ocrTable')" class="nav-link" v-bind:class="{active: page.ocrTable}">OCR详细记录</a>
      </li>
      <li class="nav-item">
        <a href="javascript:;" class="nav-link" @click="changePage('translationTable')" v-bind:class="{active: page.translationTable}">翻译详细记录</a>
      </li>
    </ul>
    <div class="p-3 page-box">
      <!--记录总览-->
      <historyOverview v-if="page.overview" />
      <!--OCR记录表格-->
      <ocrHistoryTable v-if="page.ocrTable" />
      <!--翻译记录表格-->
      <translationHistoryTable v-if="page.translationTable" />
    </div>
  </div>
</template>

<script>
import historyOverview from '@/components/history-overview';
import ocrHistoryTable from '@/components/ocr-history-table';
import translationHistoryTable from '@/components/translation-history-table';

export default {
  name: 'history-page',
  components: {
    historyOverview,
    ocrHistoryTable,
    translationHistoryTable
  },
  data() {
    return {
      page: {
        overview: true,
        ocrTable: false,
        translationTable: false
      }
    }
  },
  methods: {
    /**
     * 切换标签页
     * @param {string} pageName 要切换到的标签页名称
     */
    changePage(pageName) {
      this.page.overview = false;
      this.page.ocrTable = false;
      this.page.translationTable = false;
      this.page[pageName] = true;
    }
  },
  created() {
    document.title = '历史记录 - OCRanslate';
  }
}
</script>

<style scoped>
#history-page {
  height: 100%;
  overflow-y: auto;
  -webkit-user-select: none;
  user-select: none;
}
</style>