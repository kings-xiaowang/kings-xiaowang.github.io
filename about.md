---
title: 关于我
layout: single
author_profile: true
---

## 关于我

我是 **kings-xiaowang**，一名嵌入式与开源爱好者，喜欢折腾硬件、底层软件和各种小项目。

平时会做的事情包括：

- ESP32、Arduino、树莓派项目开发
- 硬件 DIY 和原型验证
- 3D打印模型设计与调试
- Furry OC 角色设计与 AI 绘画创作

## 我的关键词

嵌入式 · 开源 · 硬件 · IoT · 3D打印 · Furry · OC

## 联系方式

- GitHub：[kings-xiaowang](https://github.com/kings-xiaowang)
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
