import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import KPICards from '../components/KPICards';
import Charts from '../components/Charts';
import TaskTable from '../components/TaskTable';
import Profile from '../components/Profile';
import ActivityLog from '../components/ActivityLog';
import UserManagement from '../components/UserManagement';
import AddTaskModal from '../components/AddTaskModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parse } from 'date-fns';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  
  // Navigation & Filtering State
  const [period, setPeriod] = useState('weekly'); // weekly | monthly | yearly
  const [periodOffset, setPeriodOffset] = useState(0);
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels State
  const [showActivity, setShowActivity] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  const profileRef = useRef(null);

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/list');
      setUsers(res.data);
    } catch (err) { console.error('Failed to load users'); }
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) { console.error('Failed to load tasks'); }
    setLoadingTasks(false);
  };

  // ---- Date/Period Helpers ----
  const parseFlexDate = (s) => {
    if (!s) return null;
    if (/daily basis|weekly basis|monthly basis/i.test(s)) return null;
    try { return parse(s, 'dd-MM-yyyy', new Date()); } catch { return null; }
  };

  const getPeriodRange = () => {
    const now = new Date();
    if (period === 'weekly') {
      const target = addWeeks(now, periodOffset);
      const start = startOfWeek(target, { weekStartsOn: 1 });
      const end = endOfWeek(target, { weekStartsOn: 1 });
      return { start, end, label: `Week: ${format(start, 'dd-MM-yyyy')} – ${format(end, 'dd-MM-yyyy')}` };
    }
    if (period === 'monthly') {
      const target = addMonths(now, periodOffset);
      return { start: startOfMonth(target), end: endOfMonth(target), label: format(target, 'MMMM yyyy') };
    }
    const target = addYears(now, periodOffset);
    return { start: new Date(target.getFullYear(), 0, 1), end: new Date(target.getFullYear(), 11, 31), label: `${target.getFullYear()}` };
  };

  const range = getPeriodRange();

  // Filter Tasks locally based on active filters and periods
  const filteredTasks = tasks.filter(t => {
    // 1. Period filter
    const s = parseFlexDate(t.startDate);
    const d = parseFlexDate(t.deadline);
    let inPeriod = false;
    if (!s && !d) inPeriod = true; // Daily/Weekly basis tasks show everywhere
    else if (s && s >= range.start && s <= range.end) inPeriod = true;
    else if (d && d >= range.start && d <= range.end) inPeriod = true;
    if (!inPeriod) return false;

    // 2. Dropdowns & Search
    if (filterDept && t.department !== filterDept) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterUser && t.createdBy !== filterUser && t.editedBy !== filterUser) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.task.toLowerCase().includes(q) && !t.assignedTo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handlePeriodNav = (dir) => {
    if (dir === 0) setPeriodOffset(0);
    else setPeriodOffset(prev => prev + dir);
  };

  const scrollToProfile = () => {
    profileRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="dashboardPage">
      <Header 
        onActivityToggle={() => setShowActivity(!showActivity)}
        onAdminOpen={() => setShowAdmin(true)}
        onProfileClick={scrollToProfile}
      />

      <div className="main-content">
        {/* Period Navigation */}
        <div className="period-bar">
          <div className="period-tabs">
            <button className={`period-tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => { setPeriod('weekly'); setPeriodOffset(0); }}>📅 Weekly</button>
            <button className={`period-tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => { setPeriod('monthly'); setPeriodOffset(0); }}>📆 Monthly</button>
            <button className={`period-tab ${period === 'yearly' ? 'active' : ''}`} onClick={() => { setPeriod('yearly'); setPeriodOffset(0); }}>🗓 Yearly</button>
          </div>
          <button className="period-nav-btn" onClick={() => handlePeriodNav(-1)}>◀</button>
          <button className="period-nav-btn" onClick={() => handlePeriodNav(1)}>▶</button>
          <button className="period-nav-btn" onClick={() => handlePeriodNav(0)} style={{ fontWeight: 700 }}>Today</button>
          <span className="period-label">{range.label}</span>
        </div>

        {/* Filter Row */}
        <div className="filter-row">
          <label>Dept:</label>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">All</option>
            <option>Admin</option>
            <option>HR</option>
          </select>

          <label>Status:</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option>Pending</option><option>In Progress</option><option>Completed</option><option>Overdue</option><option>On Hold</option>
          </select>

          {isAdmin() && (
            <>
              <label>User:</label>
              <select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                <option value="">All Users</option>
                {users.map(u => (
                  <option key={u.loginId} value={u.loginId}>{u.displayName}</option>
                ))}
              </select>
            </>
          )}

          <label>Search:</label>
          <input 
            type="text" 
            placeholder="Task / Assigned To..." 
            style={{ width: '160px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <KPICards tasks={filteredTasks} />
        <Charts tasks={filteredTasks} period={period} />
        
        <TaskTable 
          tasks={filteredTasks}
          users={users}
          loading={loadingTasks}
          onTaskUpdate={(updated) => setTasks(tasks.map(t => t._id === updated._id ? updated : t))}
          onTaskDelete={(id) => setTasks(tasks.filter(t => t._id !== id))}
          onAddTask={() => setShowAddTask(true)}
          onBulkDelete={(ids) => {
            api.post('/tasks/bulk/delete', { ids }).then(() => {
              setTasks(tasks.filter(t => !ids.includes(t._id)));
            }).catch(console.error);
          }}
        />

        <Profile ref={profileRef} />
      </div>

      <ActivityLog open={showActivity} onClose={() => setShowActivity(false)} />
      <UserManagement open={showAdmin} onClose={() => setShowAdmin(false)} />
      <AddTaskModal 
        open={showAddTask} 
        onClose={() => setShowAddTask(false)} 
        period={period}
        onAdd={(task) => setTasks([task, ...tasks])} 
      />
    </div>
  );
}
