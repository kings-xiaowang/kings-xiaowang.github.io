// PawBlog 文章编辑器组件（IndexedDB 版）- 含图片/文件上传

function BlogPostEditor({ post, onSave, onClose }) {
  const [title, setTitle] = React.useState(post?.title || '');
  const [category, setCategory] = React.useState(post?.category || '随笔');
  const [tagsInput, setTagsInput] = React.useState((post?.tags || []).join(', '));
  const [excerpt, setExcerpt] = React.useState(post?.excerpt || '');
  const [content, setContent] = React.useState(post?.content || '');
  const [published, setPublished] = React.useState(post?.published !== false);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [storageUsage, setStorageUsage] = React.useState({ mb: 0, estimatedLimit: 500, hasRealEstimate: false });
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [categories, setCategories] = React.useState([]);
  const textareaRef = React.useRef(null);
  const previewRef = React.useRef(null);

  React.useEffect(() => {
    initEditor();
  }, []);

  // 预览模式切换后异步解析图片
  React.useEffect(() => {
    if (previewMode && previewRef.current) {
      blogResolveFileElements(previewRef.current);
    }
  }, [previewMode, content]);

  const initEditor = async () => {
    await PawDB.ensureReady();
    const cats = await PawDB.getCategories();
    setCategories(cats);
    if (post?.id) {
      const fs = await PawDB.getFilesByPostId(post.id);
      setFiles(fs);
    }
    refreshStorageUsage();
  };

  const allCategories = ['随笔', '技术', '设计', '生活', '教程', ...categories]
    .filter((v, i, a) => a.indexOf(v) === i);

  const currentPostId = post?.id || null;

  const refreshStorageUsage = async () => {
    const usage = await PawDB.getStorageUsage();
    setStorageUsage(usage);
  };

  // 在光标位置插入文本
  const insertAtCursor = (text) => {
    setPreviewMode(false);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) {
        setContent(c => c + (c ? '\n' : '') + text + '\n');
        return;
      }
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const paddedText = (before && !before.endsWith('\n') ? '\n' : '') + text + (after && !after.startsWith('\n') ? '\n' : '');
      const newContent = before + paddedText + after;
      setContent(newContent);
      setTimeout(() => {
        if (textareaRef.current) {
          const pos = start + paddedText.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 0);
    }, 0);
  };

  // 图片压缩
  const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round(e.loaded / e.total * 40)); // 前 40% 是读取
        }
      };
      reader.onload = (e) => {
        setUploadProgress(50);
        const img = new Image();
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round(h * (maxWidth / w));
            w = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          setUploadProgress(80);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
          setUploadProgress(100);
          resolve({
            base64,
            type: 'image/jpeg',
            width: w,
            height: h,
            size: Math.round(base64.length * 0.75),
          });
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  // 文件转 base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round(e.loaded / e.total * 90));
        }
      };
      reader.onload = (e) => {
        setUploadProgress(95);
        const dataUrl = e.target.result;
        const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
        setUploadProgress(100);
        resolve({ base64, type: file.type || 'application/octet-stream', size: file.size });
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      blogShowToast('图片超过 50MB 限制', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      blogShowToast('图片较大，正在压缩处理...', 'info');
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await compressImage(file, 1200, 0.8);

      const fileInfo = await PawDB.saveFile({
        name: file.name,
        type: result.type,
        size: result.size,
        data: result.base64,
        kind: 'image',
        postId: currentPostId,
      });

      blogShowToast('图片上传成功', 'success');

      const alt = file.name.replace(/\.[^.]+$/, '');
      insertAtCursor(`![${alt}](file:${fileInfo.id})`);

      // 刷新文件列表
      if (currentPostId) {
        setFiles(await PawDB.getFilesByPostId(currentPostId));
      } else {
        // 新建文章时，显示全部无 postId 的 + 刚上传的
        setFiles(prev => [...prev, fileInfo]);
      }
      refreshStorageUsage();
    } catch (err) {
      console.error('[PawBlog] 图片上传失败:', err);
      blogShowToast(err.message || '图片上传失败', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (e) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      blogShowToast('附件超过 50MB 限制', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await fileToBase64(file);
      const fileInfo = await PawDB.saveFile({
        name: file.name,
        type: result.type,
        size: file.size,
        data: result.base64,
        kind: 'file',
        postId: currentPostId,
      });

      blogShowToast('附件上传成功', 'success');
      insertAtCursor(`[📎 ${file.name}](file:${fileInfo.id})`);

      if (currentPostId) {
        setFiles(await PawDB.getFilesByPostId(currentPostId));
      } else {
        setFiles(prev => [...prev, fileInfo]);
      }
      refreshStorageUsage();
    } catch (err) {
      console.error('[PawBlog] 附件上传失败:', err);
      blogShowToast(err.message || '附件上传失败', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInsertImage = async (fileInfo) => {
    const alt = fileInfo.name.replace(/\.[^.]+$/, '');
    insertAtCursor(`![${alt}](file:${fileInfo.id})`);
  };

  const handleInsertFile = (fileInfo) => {
    insertAtCursor(`[📎 ${fileInfo.name}](file:${fileInfo.id})`);
  };

  const handleDeleteFile = async (fileInfo) => {
    if (!confirm(`确定删除文件「${fileInfo.name}」吗？\n文章中引用的地方会无法显示。`)) return;
    await PawDB.deleteFile(fileInfo.id);
    blogShowToast('文件已删除', 'info');
    if (currentPostId) {
      setFiles(await PawDB.getFilesByPostId(currentPostId));
    } else {
      setFiles(prev => prev.filter(f => f.id !== fileInfo.id));
    }
    refreshStorageUsage();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      blogShowToast('请输入文章标题', 'error');
      return;
    }
    if (!content.trim()) {
      blogShowToast('文章内容不能为空', 'error');
      return;
    }
    const tags = tagsInput
      .split(/[,，]/)
      .map(t => t.trim())
      .filter(Boolean);

    const postData = {
      title: title.trim(),
      category: category.trim() || '随笔',
      tags,
      excerpt: excerpt.trim() || PawDB.extractExcerpt(content),
      content,
      published,
    };

    const pendingFiles = files.filter(f => !f.postId).map(f => f.id);
    onSave(postData, { pendingFiles });
  };

  const images = files.filter(f => f.kind === 'image');
  const attachments = files.filter(f => f.kind === 'file');
  const usagePercent = Math.min(100, Math.round(storageUsage.mb / storageUsage.estimatedLimit * 100));
  const usageColor = usagePercent > 80 ? 'var(--blog-rose-500)'
    : usagePercent > 60 ? 'var(--blog-caramel-500)'
    : 'var(--blog-forest-500)';

  return (
    <div className="blog-modal-overlay" onClick={onClose}>
      <div
        className="blog-modal"
        style={{ maxWidth: 820, maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="blog-modal-header">
          <div className="blog-modal-title">
            {post ? '编辑文章' : '写新文章'}
          </div>
          <button className="blog-modal-close" onClick={onClose}>
            <BlogXIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="blog-form-group">
            <label className="blog-form-label">文章标题</label>
            <input
              className="blog-form-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给文章起个好听的标题吧"
            />
          </div>

          <div className="blog-form-row">
            <div className="blog-form-group">
              <label className="blog-form-label">分类</label>
              <input
                className="blog-form-input"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="blog-category-list"
                placeholder="如：技术、随笔、设计"
              />
              <datalist id="blog-category-list">
                {allCategories.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="blog-form-group">
              <label className="blog-form-label">标签（用逗号分隔）</label>
              <input
                className="blog-form-input"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="如：CSS, 前端, furry"
              />
            </div>
          </div>

          <div className="blog-form-group">
            <label className="blog-form-label">摘要（可选，留空自动生成）</label>
            <textarea
              className="blog-form-textarea"
              style={{ minHeight: 70 }}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="文章的简短介绍，留空会自动从正文提取"
            />
          </div>

          {/* 上传工具栏 */}
          <div className="blog-upload-toolbar">
            <div className="blog-upload-buttons">
              <label className="blog-upload-btn">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <BlogImageIcon size={16} />
                上传图片
              </label>
              <label className="blog-upload-btn blog-upload-btn-secondary">
                <input
                  type="file"
                  accept=".pdf,.txt,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.md,.js,.ts,.jsx,.tsx,.css,.html,.json,.py,.java,.c,.cpp,.go,.rs,.vue,.scss,.less,.sql"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <BlogPaperclipIcon size={16} />
                上传附件
              </label>
              {uploading && (
                <span style={{
                  fontSize: 12,
                  color: 'var(--blog-text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span>上传中...</span>
                  <span style={{
                    width: 60, height: 6,
                    background: 'white',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid var(--blog-mint-200)',
                  }}>
                    <span style={{
                      display: 'block',
                      width: uploadProgress + '%',
                      height: '100%',
                      background: 'var(--blog-caramel-500)',
                      transition: 'width 0.2s ease',
                    }} />
                  </span>
                  <span>{uploadProgress}%</span>
                </span>
              )}
            </div>
            <div className="blog-storage-info">
              <div className="blog-storage-bar">
                <div
                  className="blog-storage-bar-fill"
                  style={{ width: usagePercent + '%', background: usageColor }}
                />
              </div>
              <span className="blog-storage-text">
                {storageUsage.mb.toFixed(1)} MB / {storageUsage.hasRealEstimate ? storageUsage.estimatedLimit + ' MB' : storageUsage.estimatedLimit + ' MB+'}
              </span>
            </div>
          </div>

          {/* 正文编辑器 */}
          <div className="blog-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="blog-form-label" style={{ marginBottom: 0 }}>正文内容</label>
              <div className="blog-editor-preview-toggle">
                <button
                  type="button"
                  className={`blog-editor-tab ${!previewMode ? 'active' : ''}`}
                  onClick={() => setPreviewMode(false)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className={`blog-editor-tab ${previewMode ? 'active' : ''}`}
                  onClick={() => setPreviewMode(true)}
                >
                  预览
                </button>
              </div>
            </div>
            {previewMode ? (
              <div
                ref={previewRef}
                className="blog-editor-preview blog-md-content"
                dangerouslySetInnerHTML={{ __html: blogRenderMarkdown(content) || '<p style="color: var(--blog-text-tertiary)">暂无内容...</p>' }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                className="blog-form-textarea"
                style={{ minHeight: 240, fontFamily: 'var(--blog-font-mono)', fontSize: 14 }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`支持基本 Markdown 语法：\n# 一级标题\n## 二级标题\n**粗体** *斜体*\n- 列表项\n> 引用\n\`行内代码\`\n\`\`\`\n代码块\n\`\`\`\n[链接文字](url)\n![图片描述](url)`}
              />
            )}
          </div>

          {/* 已上传文件列表 */}
          {(images.length > 0 || attachments.length > 0) && (
            <div className="blog-file-gallery">
              {images.length > 0 && (
                <div className="blog-file-section">
                  <div className="blog-file-section-title">
                    <BlogImageIcon size={14} />
                    已上传图片（{images.length}）
                  </div>
                  <div className="blog-image-grid">
                    {images.map(f => (
                      <BlogFileThumb key={f.id} fileInfo={f}
                        onInsert={() => handleInsertImage(f)}
                        onDelete={() => handleDeleteFile(f)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="blog-file-section">
                  <div className="blog-file-section-title">
                    <BlogPaperclipIcon size={14} />
                    已上传附件（{attachments.length}）
                  </div>
                  <div className="blog-attachment-list">
                    {attachments.map(f => (
                      <div key={f.id} className="blog-attachment-item">
                        <span className="blog-attachment-icon">📎</span>
                        <span className="blog-attachment-name" title={f.name}>{f.name}</span>
                        <span className="blog-attachment-size">{PawDB.formatFileSize(f.size)}</span>
                        <button
                          type="button"
                          className="blog-btn blog-btn-secondary blog-btn-sm"
                          onClick={() => handleInsertFile(f)}
                        >
                          插入
                        </button>
                        <button
                          type="button"
                          className="blog-btn blog-btn-danger blog-btn-sm"
                          onClick={() => handleDeleteFile(f)}
                        >
                          <BlogTrashIcon size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="blog-form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--blog-text-secondary)' }}>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--blog-caramel-500)' }}
              />
              立即发布
            </label>
          </div>

          <div className="blog-modal-footer">
            <button type="button" className="blog-btn blog-btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="blog-btn blog-btn-primary">
              {post ? '保存修改' : '发布文章'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 图片缩略图组件（异步加载 base64）
function BlogFileThumb({ fileInfo, onInsert, onDelete }) {
  const [dataUrl, setDataUrl] = React.useState(null);

  React.useEffect(() => {
    loadThumb();
  }, [fileInfo.id]);

  const loadThumb = async () => {
    try {
      const data = await PawDB.getFileData(fileInfo.id);
      if (data) {
        const url = data.startsWith('data:') ? data : 'data:' + fileInfo.type + ';base64,' + data;
        setDataUrl(url);
      }
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="blog-image-thumb">
      <img
        src={dataUrl || ''}
        alt={fileInfo.name}
        onClick={onInsert}
        title="点击插入到文章"
        style={{ opacity: dataUrl ? 1 : 0.3 }}
      />
      <div className="blog-image-thumb-info">
        <span className="blog-image-thumb-name" title={fileInfo.name}>
          {fileInfo.name.length > 10 ? fileInfo.name.slice(0, 8) + '…' : fileInfo.name}
        </span>
        <button
          type="button"
          className="blog-image-thumb-delete"
          onClick={onDelete}
          title="删除图片"
        >
          <BlogTrashIcon size={12} />
        </button>
      </div>
    </div>
  );
}

const BlogImageIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const BlogPaperclipIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

window.BlogPostEditor = BlogPostEditor;
