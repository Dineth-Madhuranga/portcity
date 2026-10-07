export default function KPICards({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;
  const onHold = tasks.filter(t => t.status === 'On Hold').length;
  const compPct = total ? Math.round(completed / total * 100) : 0;

  const cards = [
    { label: 'Total Tasks', value: total, sub: 'In selected period', color: 'c-blue' },
    { label: 'Completed', value: completed, sub: `${compPct}% completion rate`, color: 'c-green' },
    { label: 'In Progress', value: inProgress, sub: 'Active tasks', color: 'c-orange' },
    { label: 'Overdue', value: overdue, sub: 'Needs attention', color: 'c-red' },
    { label: 'Pending', value: pending, sub: 'Not started yet', color: 'c-purple' },
    { label: 'On Hold', value: onHold, sub: 'Paused tasks', color: 'c-teal' },
  ];

  return (
    <div className="kpi-grid">
      {cards.map(c => (
        <div key={c.label} className={`kpi-card ${c.color}`}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">{c.value}</div>
          <div className="kpi-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
