// PawBlog 工具函数 - Toast、日期格式化、Markdown 渲染等
// 使用 IndexedDB (PawDB) 作为数据源，兼容 file: 前缀的资源引用

// ========== Toast 提示 ==========
let blogToastContainer = null;
function blogShowToast(message, type = 'info') {
  if (!blogToastContainer) {
    blogToastContainer = document.createElement('div');
    blogToastContainer.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      display: flex; flex-direction: column; gap: 10px; pointer-events: none;
    `;
    document.body.appendChild(blogToastContainer);
  }
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'var(--blog-forest-500)'
    : type === 'error' ? 'var(--blog-rose-500)'
    : 'var(--blog-caramel-600)';
  toast.style.cssText = `
    padding: 12px 20px; border-radius: var(--blog-radius-lg);
    background: ${bgColor}; color: white; font-size: 14px;
    font-weight: 500; box-shadow: var(--blog-shadow-lg);
    animation: blogToastSlideIn 0.3s ease-out;
    pointer-events: auto; min-width: 160px;
    font-family: var(--blog-font-body);
  `;
  toast.textContent = message;
  blogToastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'blogToastSlideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Toast 动画样式
(function injectBlogToastStyles() {
  if (document.getElementById('blog-toast-styles')) return;
  const style = document.createElement('style');
  style.id = 'blog-toast-styles';
  style.textContent = `
    @keyframes blogToastSlideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes blogToastSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes blogFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes blogPawBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
  `;
  document.head.appendChild(style);
})();

// ========== 日期格式化 ==========
function blogFormatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

function blogFormatDateShort(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function blogFormatFileSize(bytes) {
  return PawDB.formatFileSize(bytes);
}

// ========== Markdown 渲染 ==========
// 图片/链接中的 file:xxx URL 会异步替换为 data URI
// 同步版本用于编辑器预览（可能显示为占位），详情页通过 postProcessMarkdownImages 二次处理
function blogRenderMarkdown(md) {
  if (!md) return '';
  let html = md;

  // 转义 HTML 特殊字符
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // 代码块 ```
  html = html.replace(/```([\s\S]*?)```/g, function(match, code) {
    const lines = code.split('\n');
    let lang = '';
    let content = code;
    if (lines[0] && lines[0].trim() && !lines[0].includes('\n') && lines.length > 1) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 20 && !firstLine.includes(' ')) {
        lang = firstLine;
        content = lines.slice(1).join('\n');
      }
    }
    return '<pre class="blog-code-block"><code>' + content.replace(/^\n+|\n+$/g, '') + '</code></pre>';
  });

  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, '<code class="blog-inline-code">$1</code>');

  // 图片 ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, url) {
    const isFile = url.startsWith('file:');
    const fileId = isFile ? url.slice(5) : '';
    const attrs = [
      'src="' + (isFile ? '' : url) + '"',
      'alt="' + alt + '"',
      'class="blog-md-image"',
    ];
    if (isFile) {
      attrs.push('data-blog-file="' + fileId + '"');
      attrs.push('data-blog-lightbox="1"');
      attrs.push('onclick="if(this.dataset.blogLightbox) blogOpenLightboxFromEl(this)"');
    } else {
      attrs.push('onclick="blogOpenLightbox(this.src, this.alt)"');
    }
    return '<img ' + attrs.join(' ') + ' />';
  });

  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
    const isFile = url.startsWith('file:');
    const fileId = isFile ? url.slice(5) : '';

    if (isFile) {
      // 判断是否为图片
      const ext = text.split('.').pop().toLowerCase();
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
      const isImage = imageExts.includes(ext);
      if (isImage) {
        return '<img src="" alt="' + text + '" class="blog-md-image" data-blog-file="' + fileId + '" data-blog-lightbox="1" onclick="blogOpenLightboxFromEl(this)" />';
      }
      // 附件链接（带 data 属性，稍后异步填充 href 和大小）
      return '<a href="#" class="blog-md-link blog-md-attachment" data-blog-file="' + fileId + '" data-blog-filename="' + text + '" download>' + text + '</a>';
    }
    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="blog-md-link">' + text + '</a>';
  });

  // 粗体 **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 斜体 *text*
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  // 分割线
  html = html.replace(/^---\s*$/gm, '<hr class="blog-md-hr" />');

  // 引用
  const quoteRegex = /^&gt; (.+)$/gm;
  html = html.replace(quoteRegex, '<blockquote class="blog-md-quote">$1</blockquote>');

  // 标题
  html = html.replace(/^###### (.+)$/gm, '<h6 class="blog-md-h6">$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5 class="blog-md-h5">$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="blog-md-h4">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="blog-md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="blog-md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="blog-md-h1">$1</h1>');

  // 无序列表
  const ulPattern = /((?:^[-*] .+\n?)+)/gm;
  html = html.replace(ulPattern, function(match) {
    const items = match.trim().split('\n').map(function(line) {
      return '<li>' + line.replace(/^[-*] /, '') + '</li>';
    }).join('');
    return '<ul class="blog-md-ul">' + items + '</ul>';
  });

  // 有序列表
  const olPattern = /((?:^\d+\. .+\n?)+)/gm;
  html = html.replace(olPattern, function(match) {
    const items = match.trim().split('\n').map(function(line) {
      return '<li>' + line.replace(/^\d+\. /, '') + '</li>';
    }).join('');
    return '<ol class="blog-md-ol">' + items + '</ol>';
  });

  // 段落
  const blocks = html.split(/\n{2,}/);
  const processed = blocks.map(function(block) {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') ||
        trimmed.startsWith('<ul') || trimmed.startsWith('<ol') ||
        trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr') ||
        trimmed.startsWith('<img') || trimmed.startsWith('<div') ||
        trimmed.startsWith('<a')) {
      return trimmed;
    }
    return '<p class="blog-md-p">' + trimmed.replace(/\n/g, '<br />') + '</p>';
  });

  return processed.join('\n');
}

// 后处理：异步加载所有 data-blog-file 元素的实际数据
// 在 React 组件的 useEffect 中调用，传 container DOM 元素
async function blogResolveFileElements(container) {
  if (!container || !window.PawDB) return;

  const fileElements = container.querySelectorAll('[data-blog-file]');
  if (fileElements.length === 0) return;

  for (const el of fileElements) {
    const fileId = el.getAttribute('data-blog-file');
    if (!fileId) continue;

    try {
      const info = await PawDB.getFileInfo(fileId);
      const data = await PawDB.getFileData(fileId);
      if (!info || !data) {
        el.style.opacity = '0.4';
        if (el.tagName === 'IMG') {
          el.src = '';
          el.alt = (el.alt || '图片') + '（已丢失）';
        }
        continue;
      }

      const dataUrl = data.startsWith('data:') ? data : 'data:' + info.type + ';base64,' + data;

      if (el.tagName === 'IMG') {
        el.src = dataUrl;
        el.setAttribute('data-lightbox-src', dataUrl);
      } else if (el.tagName === 'A') {
        el.href = dataUrl;
        // 追加文件大小显示
        const sizeText = PawDB.formatFileSize(info.size);
        if (el.textContent.indexOf(sizeText) === -1) {
          el.textContent = el.textContent + ' (' + sizeText + ')';
        }
      }
    } catch (e) {
      console.warn('[PawBlog] 加载文件失败:', fileId, e.message);
    }
  }
}

// ========== 图片灯箱 ==========
let _blogLightboxEl = null;

function blogOpenLightbox(src, alt) {
  if (!src) return;
  if (!_blogLightboxEl) {
    _blogLightboxEl = document.createElement('div');
    _blogLightboxEl.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(42, 28, 18, 0.85);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; cursor: zoom-out;
      animation: blogFadeIn 0.2s ease-out;
    `;
    _blogLightboxEl.onclick = function(e) {
      if (e.target === _blogLightboxEl) blogCloseLightbox();
    };
    document.body.appendChild(_blogLightboxEl);
  }
  _blogLightboxEl.innerHTML = `
    <img src="${src}" alt="${alt || ''}" style="
      max-width: 100%; max-height: 100%;
      border-radius: var(--blog-radius-lg, 16px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      object-fit: contain;
    " />
    <div style="
      position: absolute; top: 20px; right: 20px;
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,0.9); color: #4A3728;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 20px; font-weight: bold;
    " onclick="blogCloseLightbox()">×</div>
  `;
  _blogLightboxEl.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function blogOpenLightboxFromEl(imgEl) {
  const src = imgEl.getAttribute('data-lightbox-src') || imgEl.src;
  blogOpenLightbox(src, imgEl.alt);
}

function blogCloseLightbox() {
  if (_blogLightboxEl) {
    _blogLightboxEl.style.display = 'none';
    _blogLightboxEl.innerHTML = '';
  }
  document.body.style.overflow = '';
}

document.addEventListener && document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') blogCloseLightbox();
});

// ========== 获取预设头像 ==========
function blogGetAvatarEmoji(avatar) {
  if (!avatar) return '🦊';
  if (avatar.startsWith('preset:')) {
    const presetId = avatar.replace('preset:', '');
    const presetEmojis = {
      fox: '🦊', cat: '🐱', wolf: '🐺',
      rabbit: '🐰', bear: '🐻', dragon: '🐉',
      dog: '🐶', panda: '🐼',
    };
    return presetEmojis[presetId] || '🦊';
  }
  return '🦊';
}

// ========== 暴露到全局 ==========
Object.assign(window, {
  blogShowToast,
  blogFormatDate,
  blogFormatDateShort,
  blogFormatFileSize,
  blogRenderMarkdown,
  blogResolveFileElements,
  blogOpenLightbox,
  blogOpenLightboxFromEl,
  blogCloseLightbox,
  blogGetAvatarEmoji,
});
