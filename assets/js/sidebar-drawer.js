document.addEventListener("DOMContentLoaded", function(){
if(window.innerWidth >= 1024){
  const handle = document.createElement('div');
  handle.className = "drawer-handle";
  const drawer = document.createElement('div');
  drawer.className = "slide-sidebar";

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

  handle.addEventListener("mouseenter",()=>drawer.classList.add("open"));
  drawer.addEventListener("mouseleave",()=>drawer.classList.remove("open"));
}
})
