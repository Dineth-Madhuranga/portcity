import ReactECharts from 'echarts-for-react';

export default function Charts({ tasks, period }) {
  const statuses = ['Pending', 'In Progress', 'Completed', 'Overdue', 'On Hold'];
  const statusColors = ['#d97706', '#2563eb', '#16a34a', '#dc2626', '#6b7280'];
  const statusCounts = statuses.map(s => tasks.filter(t => t.status === s).length);

  const donutOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['42%', '70%'],
      label: { show: true, formatter: '{b}\n{c}' },
      data: statuses.map((s, i) => ({
        name: s,
        value: statusCounts[i],
        itemStyle: { color: statusColors[i] }
      })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,.2)' } }
    }]
  };

  const depts = ['Admin', 'HR'];
  const deptCounts = depts.map(d => tasks.filter(t => t.department === d).length);
  const deptComplete = depts.map(d => tasks.filter(t => t.department === d && t.status === 'Completed').length);
  const deptPending = depts.map(d => tasks.filter(t => t.department === d && t.status === 'Pending').length);

  const barOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Total', 'Completed', 'Pending'], bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: depts },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: 'Total', type: 'bar', data: deptCounts, itemStyle: { color: '#2563eb' } },
      { name: 'Completed', type: 'bar', data: deptComplete, itemStyle: { color: '#16a34a' } },
      { name: 'Pending', type: 'bar', data: deptPending, itemStyle: { color: '#d97706' } }
    ]
  };

  // Priority distribution
  const priorities = ['High', 'Medium', 'Low'];
  const priorityColors = ['#dc2626', '#d97706', '#16a34a'];
  const priorityCounts = priorities.map(p => tasks.filter(t => t.priority === p).length);

  const priorityOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      label: { show: true, formatter: '{b}\n{c}' },
      data: priorities.map((p, i) => ({
        name: p + ' Priority',
        value: priorityCounts[i],
        itemStyle: { color: priorityColors[i] }
      }))
    }]
  };

  return (
    <div className="charts-row">
      <div className="chart-card">
        <h3>Status Distribution</h3>
        <div className="chart-box">
          <ReactECharts option={donutOption} style={{ height: '100%' }} />
        </div>
      </div>
      <div className="chart-card">
        <h3>Department Tasks</h3>
        <div className="chart-box">
          <ReactECharts option={barOption} style={{ height: '100%' }} />
        </div>
      </div>
      <div className="chart-card">
        <h3>Priority Breakdown</h3>
        <div className="chart-box">
          <ReactECharts option={priorityOption} style={{ height: '100%' }} />
        </div>
      </div>
    </div>
  );
}
