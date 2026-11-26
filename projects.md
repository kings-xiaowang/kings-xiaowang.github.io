---
title: 项目
layout: single
author_profile: true
---

# 项目列表

## ESP32 硬件开发

- ESP32 传感器节点
- M5Cardputer 小项目
- IoT 数据采集原型

## 3D打印

- 自制支架与外壳
- 模型测试与打印调参
- 功能型小工具设计

## Furry OC 创作

- OC 角色设定
- AI 绘画素材整理
- 角色视觉风格探索
<script>
document.addEventListener("DOMContentLoaded", function(){
if(window.innerWidth >= 1024){
  const handle = document.createElement('div');
  handle.className = "drawer-handle";
  const drawer = document.createElement('div');
  drawer.className = "slide-sidebar";

  // 侧边抽屉内的内容，在这里自定义修改
  drawer.innerHTML = `
    <h2>kings-xiaowang</h2>
    <p>嵌入式爱好者，喜欢折腾 ESP32、树莓派、底层开发。开源项目、3D打印、AI绘画 OC创作。</p>
    <p>📍 China</p>
    <ul style="padding-left:1rem;">
      <li><a href="/">首页</a></li>
      <li><a href="/projects">项目</a></li>
      <li><a href="https://github.com/kings-xiaowang">GitHub</a></li>
    </ul>
  `;

  document.body.prepend(drawer);
  document.body.prepend(handle);

  // 鼠标移入把手打开抽屉；鼠标离开抽屉区域自动关闭
  handle.addEventListener("mouseenter",()=>drawer.classList.add("open"));
  drawer.addEventListener("mouseleave",()=>drawer.classList.remove("open"));
}
})
</script>
