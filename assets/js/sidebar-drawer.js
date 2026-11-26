window.onload = function(){
  if(document.querySelector('.drawer-handle')) return;

  if(window.innerWidth >= 1024){
    const handle = document.createElement('div');
    const drawer = document.createElement('div');

    // 触发把手样式（内联，不依赖 CSS 文件）
    handle.style.cssText = `
      position:fixed; left:0; top:0; width:40px; height:100vh;
      background:#238636; border-right:1px solid #30363d;
      z-index:1001;
    `;

    // 抽屉面板样式：默认移出屏幕左侧
    drawer.style.cssText = `
      position:fixed; left:0; top:0; width:260px; height:100vh;
      background:#161b22; z-index:1000; padding:1rem;
      transform:translateX(-100%); transition:transform .3s ease;
      overflow-y:auto; color:#e2e2e2;
    `;

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

    // 移入把手 -> 滑出
    handle.addEventListener("mouseenter", () => {
      drawer.style.transform = "translateX(0)";
    });
    // 移出抽屉 -> 收回
    drawer.addEventListener("mouseleave", () => {
      drawer.style.transform = "translateX(-100%)";
    });
  }
}
