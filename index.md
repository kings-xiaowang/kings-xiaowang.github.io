---
layout: single
author_profile: true
title: "首页"
---

# 👋 Hello，我是 kings-xiaowang

嵌入式爱好者，喜欢折腾 ESP32、树莓派、底层开发。
爱好：开源项目、3D 打印、AI 绘画 OC 创作。

## 📂 精选项目

- ⚙️ **ESP32 相关开发与硬件 DIY**
  传感器采集、M5Cardputer、物联网原型、底层驱动调试
- 🛠️ **各类底层折腾小工具**
  WSL、USBIP、交叉编译、嵌入式系统折腾
- 🎨 **Furry OC 素材与 3D 打印作品**
  OC 角色设定、AI 绘画、功能外壳模型打印

## 🔗 链接

- GitHub：[github.com/kings-xiaowang](https://github.com/kings-xiaowang)

## 📝 最新文章

> 后续技术笔记、踩坑记录都会放在这里。
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
