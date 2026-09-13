// PawBlog 全局错误捕获 & 应用入口
// 在加载所有业务代码之前先安装，确保任何错误都能展示给用户

(function () {
  let errorInfo = null;
  let errorCount = 0;

  function showErrorPage(message, detail) {
    // 避免重复渲染
    if (document.getElementById('pawblog-error-page')) return;

    const root = document.getElementById('root');
    if (!root) {
      // root 还不存在，等一下再试
      setTimeout(() => showErrorPage(message, detail), 100);
      return;
    }

    root.innerHTML = `
      <div id="pawblog-error-page" style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #FDF6EC;
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
        padding: 20px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(184, 116, 63, 0.12);
          max-width: 560px;
          width: 100%;
          text-align: center;
          border: 1px solid #F0E2CE;
        ">
          <div style="font-size: 56px; margin-bottom: 16px;">🦊💥</div>
          <h2 style="
            margin: 0 0 12px 0;
            color: #8B5A2B;
            font-family: 'Fredoka', 'Noto Sans SC', sans-serif;
            font-size: 24px;
          ">哎呀，出了点小问题</h2>
          <p style="
            margin: 0 0 16px 0;
            color: #6B5440;
            font-size: 15px;
            line-height: 1.7;
          ">${message || '页面加载时遇到了一点小麻烦。'}</p>
          
          ${detail ? `
            <div style="
              background: #FFF8EF;
              border: 1px solid #F0E2CE;
              border-radius: 12px;
              padding: 14px 16px;
              margin: 16px 0;
              text-align: left;
              font-family: 'JetBrains Mono', 'SF Mono', monospace;
              font-size: 12px;
              color: #8B5A2B;
              white-space: pre-wrap;
              word-break: break-all;
              max-height: 200px;
              overflow-y: auto;
            ">${String(detail).slice(0, 500)}</div>
          ` : ''}

          <div style="
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 20px;
            flex-wrap: wrap;
          ">
            <button onclick="location.reload()" style="
              padding: 12px 24px;
              background: #B8743F;
              color: white;
              border: none;
              border-radius: 12px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              font-family: inherit;
              box-shadow: 0 4px 12px rgba(184, 116, 63, 0.25);
            ">🔄 刷新重试</button>
            <button onclick="location.hash = '#/';" style="
              padding: 12px 24px;
              background: white;
              color: #B8743F;
              border: 1px solid #E5D2BA;
              border-radius: 12px;
              font-size: 15px;
              font-weight: 500;
              cursor: pointer;
              font-family: inherit;
            ">🏠 返回首页</button>
          </div>

          <div style="
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px dashed #E5D2BA;
            font-size: 12px;
            color: #A89684;
          ">
            小狐狸正在抢修中... 如持续出错请尝试清除浏览器缓存
          </div>
        </div>
      </div>
    `;
  }

  // 捕获同步错误
  window.onerror = function (msg, url, line, col, error) {
    errorCount++;
    console.error('[PawBlog Error]', msg, url, line, col, error);

    // 忽略一些不影响的资源加载错误
    if (typeof msg === 'string' && msg.indexOf('Script error') === 0 && !url) {
      return false;
    }

    const message = msg || '未知错误';
    const detail = error?.stack || (url ? `${url}:${line}:${col}` : '');

    // 第一个错误就展示，但不中断（可能是 React 已经处理了）
    if (errorCount <= 3) {
      try {
        showErrorPage(String(message), detail);
      } catch (e) { /* ignore */ }
    }
    return false;
  };

  // 捕获未处理的 Promise 错误
  window.addEventListener('unhandledrejection', function (event) {
    errorCount++;
    const reason = event.reason;
    console.error('[PawBlog Unhandled Promise]', reason);

    // 忽略一些非致命错误
    if (reason?.name === 'AbortError') return;

    const message = reason?.message || reason || '异步操作出错';
    const detail = reason?.stack || String(reason);

    if (errorCount <= 3) {
      try {
        showErrorPage(String(message), detail);
      } catch (e) { /* ignore */ }
    }
  });

  // React 错误边界的后备：检测 root 为空时显示加载提示
  document.addEventListener('DOMContentLoaded', function () {
    const root = document.getElementById('root');
    if (root && !root.innerHTML) {
      // 先显示一个友好的加载态
      root.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 16px;
          background: #FDF6EC;
          color: #A89684;
          font-family: 'Noto Sans SC', sans-serif;
        ">
          <div style="font-size: 40px; animation: pawBounce 0.8s ease-in-out infinite;">🐾</div>
          <div>小狐狸正在起床...</div>
        </div>
        <style>
          @keyframes pawBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        </style>
      `;
    }
  });

  // 5 秒后如果还是加载态且无报错，提示用户
  setTimeout(function () {
    const el = document.getElementById('pawblog-error-page');
    const root = document.getElementById('root');
    if (!el && root && root.innerHTML.indexOf('小狐狸正在起床') !== -1) {
      // 还在加载态，可能是 Babel 转译慢或脚本加载失败
      // 给一个更明确的提示（不替换，只追加）
      const hint = document.createElement('div');
      hint.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 10px 18px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        font-size: 13px;
        color: #8B5A2B;
        font-family: 'Noto Sans SC', sans-serif;
        z-index: 9999;
      `;
      hint.innerHTML = '加载时间较长？<a href="#" onclick="location.reload();return false;" style="color:#B8743F">点击刷新</a> 或检查网络连接';
      document.body.appendChild(hint);
    }
  }, 5000);

})();
