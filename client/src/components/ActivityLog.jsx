import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ActivityLog({ open, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      api.get('/activity')
        .then(res => setLogs(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open]);

  return (
    <div className={`activity-panel ${open ? 'open' : ''}`}>
      <h2>
        📋 Activity Log 
        <button className="close-btn" onClick={onClose}>✕</button>
      </h2>
      <div id="activityList">
        {loading ? (
          <div className="log-item" style={{justifyContent: 'center', color: '#6b7280'}}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="log-item" style={{justifyContent: 'center', color: '#6b7280'}}>No activity yet</div>
        ) : (
          logs.map(l => (
            <div className="log-item" key={l._id}>
              <div className={`log-dot ${l.type}`}></div>
              <div className="log-text">
                <strong>{l.user}</strong> {l.msg}
              </div>
              <div className="log-time">{new Date(l.createdAt).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
