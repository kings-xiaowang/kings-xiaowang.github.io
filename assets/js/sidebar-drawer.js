window.onload = function(){
  if(document.querySelector('.drawer-handle')) return;

  // 只在桌面大屏启用
  if(window.innerWidth >= 1024){
    const handle = document.createElement('div');
    const drawer = document.createElement('div');

    // 左侧把手：全屏高度的竖条
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

    // 关键：页面整体右移 40px，头像/内容避开左侧竖条，不会被压住
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
}
