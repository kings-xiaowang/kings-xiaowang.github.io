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
window.onload = function(){
  if(document.querySelector('.drawer-handle')) return;

  const handle = document.createElement('div');
  const drawer = document.createElement('div');

  // 左侧把手：全屏高度竖条
  handle.style.cssText = `
    position:fixed; left:0; top:0; width:40px; height:100vh;
    background:#22272e; border-right:1px solid #30363d;
    z-index:1001;
  `;

  // 抽屉面板
  drawer.style.cssText = `
    position:fixed; left:0; top:0; width:260px; height:100vh;
    background:#161b22; z-index:1000; padding:1rem;
    transform:translateX(-100%); transition:transform .3s ease;
    overflow-y:auto; color:#e2e2e2;
  `;

  drawer.innerHTML = `
    <h2 style="margin:0 0 1rem 0;">kings-xiaowang</h2>
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

  // 页面整体右移，避开左侧竖条
  document.body.style.paddingLeft = "40px";

  // 移入把手：抽屉滑出，把手隐藏
  handle.addEventListener("mouseenter", () => {
    drawer.style.transform = "translateX(0)";
    handle.style.opacity = "0";
    handle.style.pointerEvents = "none";
  });

  // 鼠标离开抽屉：抽屉收回，把手重现
  drawer.addEventListener("mouseleave", () => {
    drawer.style.transform = "translateX(-100%)";
    handle.style.opacity = "1";
    handle.style.pointerEvents = "auto";
  });
}
</script>
