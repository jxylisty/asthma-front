<template>
  <div class="expert-container">
    <h2>专家模式：降气平哮方 靶点网络机制分析</h2>
    <div id="cy" style="width: 100%; height: 600px; background-color: #1e1e1e; border-radius: 12px;"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import cytoscape from 'cytoscape'

onMounted(() => {
  // 1. 初始化 Cytoscape 实例
  const cy = cytoscape({
    container: document.getElementById('cy'), // 挂载到 div
    
    // 2. 这里就是你刚才定好的 JSON 假数据
    elements: [
      // 节点 Nodes
      { data: { id: "P_01", label: "降气平哮方", category: "prescription" } },
      { data: { id: "H_麻黄", label: "麻黄", category: "herb" } },
      { data: { id: "H_地龙", label: "地龙", category: "herb" } },
      { data: { id: "C_麻黄碱", label: "麻黄碱 (98%)", category: "compound" } },
      { data: { id: "C_次黄嘌呤", label: "次黄嘌呤 (85%)", category: "compound" } },
      { data: { id: "T_IL4", label: "IL-4", category: "target" } },
      { data: { id: "T_TNF", label: "TNF", category: "target" } },
      
      // 连线 Edges
      { data: { source: "P_01", target: "H_麻黄" } },
      { data: { source: "P_01", target: "H_地龙" } },
      { data: { source: "H_麻黄", target: "C_麻黄碱" } },
      { data: { source: "H_地龙", target: "C_次黄嘌呤" } },
      { data: { source: "C_麻黄碱", target: "T_IL4" } },
      { data: { source: "C_麻黄碱", target: "T_TNF" } }
    ],

    // 3. 样式表 (决定颜色和形状)
    style: [
      {
        selector: 'node[category="prescription"]', // 方剂节点样式
        style: { 'background-color': '#f1c40f', 'shape': 'star', 'label': 'data(label)', 'color': '#fff' }
      },
      {
        selector: 'node[category="herb"]', // 药材节点样式
        style: { 'background-color': '#2ecc71', 'shape': 'round-rectangle', 'label': 'data(label)', 'color': '#fff' }
      },
      {
        selector: 'node[category="compound"]', // 成分节点样式
        style: { 'background-color': '#3498db', 'shape': 'ellipse', 'label': 'data(label)', 'color': '#fff' }
      },
      {
        selector: 'node[category="target"]', // 靶点节点样式
        style: { 'background-color': '#e74c3c', 'shape': 'diamond', 'label': 'data(label)', 'color': '#fff' }
      },
      {
        selector: 'edge',
        style: { 'width': 2, 'line-color': '#7f8c8d', 'curve-style': 'bezier' }
      }
    ],

    // 4. 布局算法 (自动排版)
    layout: {
      name: 'breadthfirst', // 树状发散布局
      directed: true,
      padding: 10
    }
  });
})
</script>

<style scoped>
.expert-container {
  padding: 20px;
  background-color: #f5f5f5;
}
.expert-container h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}
</style>