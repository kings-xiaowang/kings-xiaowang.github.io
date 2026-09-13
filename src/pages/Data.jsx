// 数据管理页面
function DataPage({ onLogout }) {
  const [confirmAction, setConfirmAction] = React.useState(null); // 'clear' | 'reset' | 'import'
  const [importFile, setImportFile] = React.useState(null);
  const [importData, setImportData] = React.useState(null);

  const handleExport = async () => {
    try {
      const result = await AdminDataAPI.exportData();
      const dataStr = JSON.stringify(result.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `pawadmin-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('数据导出成功', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        setImportData(data);
      } catch (err) {
        showToast('文件格式不正确，请选择 JSON 文件', 'error');
        setImportFile(null);
      }
    };
    reader.onerror = () => {
      showToast('文件读取失败', 'error');
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    if (!importData) return;
    try {
      await AdminDataAPI.importData(importData);
      showToast('数据导入成功', 'success');
      setConfirmAction(null);
      setImportFile(null);
      setImportData(null);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleClearProjects = async () => {
    try {
      await AdminDataAPI.clearProjects();
      showToast('项目数据已清空', 'success');
      setConfirmAction(null);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleResetAll = async () => {
    try {
      await AdminDataAPI.resetAll();
      showToast('已重置为默认数据', 'success');
      setConfirmAction(null);
      // 重置后重新拉取 admin
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const startImport = () => {
    setImportFile(null);
    setImportData(null);
    setConfirmAction('import');
    // 触发文件选择
    setTimeout(() => {
      document.getElementById('import-file-input')?.click();
    }, 100);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据管理</h1>
        <p className="page-subtitle">导出、导入和管理你的所有数据</p>
      </div>

      {/* 数据导出 */}
      <div className="data-section">
        <div className="data-section-title">
          <DownloadIcon size={18} color="var(--color-caramel-700)" style={{ marginRight: 6, verticalAlign: 'middle' }} />
          数据导出
        </div>
        <div className="data-action-card">
          <div className="data-action-info">
            <h4>导出所有数据</h4>
            <p>将个人信息和全部项目数据导出为 JSON 文件，可用于备份或迁移</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>
            <DownloadIcon size={16} />
            导出 JSON
          </button>
        </div>
      </div>

      {/* 数据导入 */}
      <div className="data-section">
        <div className="data-section-title">
          <UploadIcon size={18} color="var(--color-caramel-700)" style={{ marginRight: 6, verticalAlign: 'middle' }} />
          数据导入
        </div>
        <div className="data-action-card">
          <div className="data-action-info">
            <h4>从 JSON 文件导入</h4>
            <p>上传之前导出的 JSON 文件恢复数据，将覆盖现有数据</p>
          </div>
          <button className="btn btn-secondary" onClick={startImport}>
            <UploadIcon size={16} />
            导入数据
          </button>
        </div>
      </div>

      {/* 危险操作区 */}
      <div className="data-section">
        <div className="data-section-title">
          <AlertIcon size={18} color="#dc2626" style={{ marginRight: 6, verticalAlign: 'middle' }} />
          危险操作
        </div>
        <div className="data-action-card danger-zone">
          <div className="data-action-info">
            <h4>清空所有项目</h4>
            <p>删除所有项目数据，保留管理员账号和个人信息</p>
          </div>
          <button className="btn btn-danger" onClick={() => setConfirmAction('clear')}>
            <TrashIcon size={16} />
            清空项目
          </button>
        </div>
        <div className="data-action-card danger-zone">
          <div className="data-action-info">
            <h4>重置为默认数据</h4>
            <p>清除所有数据并恢复初始状态，包括示例项目和默认密码</p>
          </div>
          <button className="btn btn-danger" onClick={() => setConfirmAction('reset')}>
            <AlertIcon size={16} />
            重置全部
          </button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        id="import-file-input"
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImportFileSelect}
      />

      {/* 确认弹窗 */}
      {confirmAction && (
        <div className="modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              {confirmAction === 'clear' && (
                <>
                  <div className="confirm-icon warning">
                    <AlertIcon size={28} />
                  </div>
                  <div className="confirm-title">确认清空所有项目？</div>
                  <div className="confirm-message">
                    此操作将删除所有项目数据，且不可撤销。
                  </div>
                </>
              )}
              {confirmAction === 'reset' && (
                <>
                  <div className="confirm-icon danger">
                    <AlertIcon size={28} />
                  </div>
                  <div className="confirm-title">确认重置为默认数据？</div>
                  <div className="confirm-message">
                    所有数据将被清除并恢复初始状态，包括管理员密码。
                  </div>
                </>
              )}
              {confirmAction === 'import' && (
                <>
                  <div className="confirm-icon warning">
                    <UploadIcon size={28} />
                  </div>
                  <div className="confirm-title">
                    {importFile ? '确认导入数据？' : '选择导入文件'}
                  </div>
                  <div className="confirm-message">
                    {importFile
                      ? `已选择文件：${importFile.name}（${(importFile.size / 1024).toFixed(1)} KB）`
                      : '请选择要导入的 JSON 文件'}
                  </div>
                  {importFile && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: '#fef3c7',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 12,
                      color: '#92400e',
                    }}>
                      ⚠️ 导入将覆盖现有数据，请确认数据无误
                    </div>
                  )}
                  {!importFile && (
                    <button
                      className="btn btn-secondary"
                      style={{ marginTop: 12 }}
                      onClick={() => document.getElementById('import-file-input')?.click()}
                    >
                      选择文件
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>
                取消
              </button>
              {confirmAction === 'clear' && (
                <button className="btn btn-danger" onClick={handleClearProjects}>
                  确认清空
                </button>
              )}
              {confirmAction === 'reset' && (
                <button className="btn btn-danger" onClick={handleResetAll}>
                  确认重置
                </button>
              )}
              {confirmAction === 'import' && (
                <button
                  className="btn btn-primary"
                  onClick={handleImportConfirm}
                  disabled={!importData}
                >
                  确认导入
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.DataPage = DataPage;
