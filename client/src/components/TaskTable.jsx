import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed', 'Overdue', 'On Hold'];
const STATUS_CLASS = {
  'Pending': 's-pending',
  'In Progress': 's-progress',
  'Completed': 's-completed',
  'Overdue': 's-overdue',
  'On Hold': 's-onhold'
};

function canEditTask(user, task) {
  if (user?.role === 'Admin') return true;
  if (user?.role === 'Viewer') return false;
  // Regular users: can only edit tasks they created
  return task.createdBy === user?.loginId;
}

function getUserDisplay(users, loginId) {
  if (!loginId) return 'System';
  const u = users.find(x => x.loginId === loginId);
  return u ? u.displayName : loginId;
}

export default function TaskTable({ tasks, users, onTaskUpdate, onTaskDelete, onAddTask, onBulkDelete, loading }) {
  const { user, isAdmin, isViewer } = useAuth();
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedIds(new Set());
  };

  const handleCheck = (id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const deletable = tasks.filter(t => isAdmin() || canEditTask(user, t));
      setSelectedIds(new Set(deletable.map(t => t._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) { toast.error('No tasks selected'); return; }
    if (!confirm(`Delete ${selectedIds.size} selected task(s)?`)) return;
    onBulkDelete([...selectedIds]);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleStatusChange = async (task, newStatus) => {
    if (!canEditTask(user, task) && !isAdmin()) {
      toast.error('You cannot edit this task'); return;
    }
    try {
      const updated = await api.put(`/tasks/${task._id}`, { status: newStatus });
      onTaskUpdate(updated.data);
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const startEdit = (task, field) => {
    setEditingCell({ id: task._id, field });
    setEditValue(task[field] || '');
  };

  const commitEdit = async (task, field) => {
    const newVal = editValue.trim();
    if (newVal === (task[field] || '')) { setEditingCell(null); return; }
    if (!canEditTask(user, task)) { toast.error('You cannot edit this task'); setEditingCell(null); return; }
    try {
      const updated = await api.put(`/tasks/${task._id}`, { [field]: newVal });
      onTaskUpdate(updated.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
    setEditingCell(null);
  };

  const handleDelete = async (task) => {
    if (!canEditTask(user, task) && !isAdmin()) { toast.error('Cannot delete this task'); return; }
    if (!confirm(`Delete task "${task.task}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onTaskDelete(task._id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const exportCSV = () => {
    const header = ['#','Task','Assigned To','Department','Start Date','Deadline','Status','Priority','Created By','Edited By'];
    const rows = tasks.map((t,i) => [
      i+1,
      `"${(t.task||'').replace(/"/g,'""')}"`,
      `"${(t.assignedTo||'').replace(/"/g,'""')}"`,
      t.department, t.startDate, t.deadline, t.status, t.priority,
      getUserDisplay(users, t.createdBy),
      getUserDisplay(users, t.editedBy)
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tasks_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast.success('CSV exported!');
  };

  const isEditing = (id, field) => editingCell?.id === id && editingCell?.field === field;

  const editableCell = (task, field) => {
    const canEdit = canEditTask(user, task);
    if (!canEdit) return <span>{task[field]}</span>;
    if (isEditing(task._id, field)) {
      return (
        <input
          className="cell-input"
          value={editValue}
          autoFocus
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => commitEdit(task, field)}
          onKeyDown={e => { if(e.key==='Enter') commitEdit(task, field); if(e.key==='Escape') setEditingCell(null); }}
        />
      );
    }
    return (
      <span
        className="cell-edit"
        onClick={() => startEdit(task, field)}
        title="Click to edit"
      >
        {task[field]}
      </span>
    );
  };

  return (
    <div className="table-card">
      <div className="table-header">
        <h2>📋 {isAdmin() ? 'All Task Records' : 'My Tasks'} <span className="count-badge">{tasks.length}</span></h2>
        <div className="table-actions">
          {!isViewer() && (
            <button className="tbl-btn primary" onClick={onAddTask}>➕ Add Task</button>
          )}
          <button
            className={`tbl-btn ${selectMode ? 'primary' : ''}`}
            onClick={toggleSelectMode}
          >
            ☑ Select
          </button>
          {selectMode && selectedIds.size > 0 && (
            <button className="tbl-btn danger" onClick={handleBulkDelete}>
              🗑 Delete ({selectedIds.size})
            </button>
          )}
          <button className="tbl-btn success" onClick={exportCSV}>📥 Export CSV</button>
        </div>
      </div>
      <div className="table-wrap">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '3rem' }}>📋</div>
            <p>No tasks found for this period/filter</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {selectMode && (
                  <th className="sel-col">
                    <input
                      type="checkbox"
                      onChange={e => handleSelectAll(e.target.checked)}
                      title="Select all"
                    />
                  </th>
                )}
                <th>#</th>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Dept</th>
                <th>Start Date</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => {
                const canEdit = canEditTask(user, t);
                const canDelete = isAdmin() || canEdit;
                return (
                  <tr key={t._id}>
                    {selectMode && (
                      <td className="sel-col">
                        {canDelete && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(t._id)}
                            onChange={e => handleCheck(t._id, e.target.checked)}
                          />
                        )}
                      </td>
                    )}
                    <td>{i + 1}</td>
                    <td>{editableCell(t, 'task')}</td>
                    <td>{editableCell(t, 'assignedTo')}</td>
                    <td>{editableCell(t, 'department')}</td>
                    <td>{editableCell(t, 'startDate')}</td>
                    <td>{editableCell(t, 'deadline')}</td>
                    <td>
                      {(isAdmin() || canEdit) ? (
                        <select
                          className="status-select"
                          value={t.status}
                          onChange={e => handleStatusChange(t, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`status-badge ${STATUS_CLASS[t.status] || ''}`}>{t.status}</span>
                      )}
                    </td>
                    <td>
                      {canEdit ? (
                        editableCell(t, 'priority')
                      ) : (
                        <span className={`priority-badge p-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '.75rem', color: '#6b7280' }}>
                      {getUserDisplay(users, t.createdBy)}
                      {t.editedBy && t.editedBy !== t.createdBy && (
                        <span> / {getUserDisplay(users, t.editedBy)}</span>
                      )}
                    </td>
                    <td>
                      {canDelete && (
                        <button className="del-btn" onClick={() => handleDelete(t)} title="Delete">🗑</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
