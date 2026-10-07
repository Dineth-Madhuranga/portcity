import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export default function AddTaskModal({ open, onClose, onAdd, period }) {
  const getDefaultDates = () => {
    const now = new Date();
    let s = now, e = now;
    if (period === 'weekly') { s = startOfWeek(now, {weekStartsOn: 1}); e = endOfWeek(now, {weekStartsOn: 1}); }
    else if (period === 'monthly') { s = startOfMonth(now); e = endOfMonth(now); }
    else if (period === 'yearly') { s = startOfYear(now); e = endOfYear(now); }
    return { start: format(s, 'yyyy-MM-dd'), end: format(e, 'yyyy-MM-dd') };
  };

  const defaults = getDefaultDates();
  
  const [taskName, setTaskName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [department, setDepartment] = useState('Admin');
  const [startDate, setStartDate] = useState(defaults.start);
  const [deadline, setDeadline] = useState(defaults.end);
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!taskName.trim() || !assignedTo.trim()) {
      toast.error('Task Name and Assigned To are required'); return;
    }
    
    // Format dates back to dd-mm-yyyy for display consistency if dates are picked
    const formatDateToDisplay = (isoString) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      return format(d, 'dd-MM-yyyy');
    };

    setLoading(true);
    try {
      const res = await api.post('/tasks', {
        task: taskName,
        assignedTo,
        department,
        startDate: formatDateToDisplay(startDate),
        deadline: formatDateToDisplay(deadline),
        priority
      });
      onAdd(res.data);
      toast.success('Task added successfully');
      setTaskName(''); setAssignedTo('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className={`modal-overlay ${open ? 'show' : ''}`} onClick={(e) => { if(e.target.className.includes('modal-overlay')) onClose(); }}>
      <div className="modal-box">
        <h2>➕ Add New Task</h2>
        
        <div className="field">
          <label>Task Name *</label>
          <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} autoFocus />
        </div>
        
        <div className="field">
          <label>Assigned To *</label>
          <input type="text" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
        </div>
        
        <div className="field">
          <label>Department</label>
          <select value={department} onChange={e => setDepartment(e.target.value)}>
            <option>Admin</option>
            <option>HR</option>
          </select>
        </div>
        
        <div className="field">
          <label>Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        
        <div className="field">
          <label>Deadline</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </div>
        
        <div className="field">
          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option>Medium</option>
            <option>High</option>
            <option>Low</option>
          </select>
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
