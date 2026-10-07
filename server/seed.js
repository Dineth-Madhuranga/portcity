require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const ActivityLog = require('./models/ActivityLog');

const DEFAULT_USERS = [
  { loginId: 'admin', password: 'admin123', displayName: 'Administrator', role: 'Admin', color: '#2563eb', enabled: true },
  { loginId: 'hrmanager', password: 'hr123', displayName: 'HR Manager', role: 'User', color: '#16a34a', enabled: true },
  { loginId: 'johndoe', password: 'john123', displayName: 'John Doe', role: 'User', color: '#d97706', enabled: true },
  { loginId: 'janesmith', password: 'jane123', displayName: 'Jane Smith', role: 'User', color: '#7c3aed', enabled: true },
  { loginId: 'viewer1', password: 'view123', displayName: 'Guest Viewer', role: 'Viewer', color: '#6b7280', enabled: true }
];

const DEFAULT_TASKS = [
  { task: "Office Supply Procurement", assignedTo: "John Doe", department: "Admin", startDate: "04-08-2026", deadline: "08-08-2026", status: "Completed", priority: "Medium", createdBy: "admin", editedBy: "admin" },
  { task: "Employee Onboarding", assignedTo: "Jane Smith", department: "HR", startDate: "01-08-2026", deadline: "15-08-2026", status: "In Progress", priority: "High", createdBy: "admin", editedBy: "hrmanager" },
  { task: "Payroll Processing", assignedTo: "Jane Smith", department: "HR", startDate: "25-08-2026", deadline: "28-08-2026", status: "Pending", priority: "High", createdBy: "admin", editedBy: "admin" },
  { task: "Facility Maintenance", assignedTo: "John Doe", department: "Admin", startDate: "05-08-2026", deadline: "10-08-2026", status: "Completed", priority: "Low", createdBy: "admin", editedBy: "johndoe" },
  { task: "Policy Review & Update", assignedTo: "Jane Smith", department: "HR", startDate: "01-09-2026", deadline: "30-09-2026", status: "Pending", priority: "Medium", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "IT Equipment Setup", assignedTo: "John Doe", department: "Admin", startDate: "03-08-2026", deadline: "07-08-2026", status: "Completed", priority: "Medium", createdBy: "admin", editedBy: "johndoe" },
  { task: "Attendance System Audit", assignedTo: "Jane Smith", department: "HR", startDate: "10-08-2026", deadline: "20-08-2026", status: "In Progress", priority: "Medium", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Vendor Contract Renewal", assignedTo: "John Doe", department: "Admin", startDate: "15-08-2026", deadline: "22-08-2026", status: "In Progress", priority: "High", createdBy: "admin", editedBy: "admin" },
  { task: "Leave Management Report", assignedTo: "Jane Smith", department: "HR", startDate: "01-08-2026", deadline: "05-08-2026", status: "Completed", priority: "Low", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Office Renovation Plan", assignedTo: "John Doe", department: "Admin", startDate: "18-08-2026", deadline: "30-08-2026", status: "Pending", priority: "High", createdBy: "admin", editedBy: "admin" },
  { task: "Grievance Handling", assignedTo: "Jane Smith", department: "HR", startDate: "01-09-2026", deadline: "15-09-2026", status: "Pending", priority: "High", createdBy: "admin", editedBy: "hrmanager" },
  { task: "Annual Budget Prep", assignedTo: "John Doe", department: "Admin", startDate: "01-09-2026", deadline: "30-09-2026", status: "Pending", priority: "High", createdBy: "admin", editedBy: "admin" },
  { task: "Fire Safety Drill", assignedTo: "John Doe", department: "Admin", startDate: "10-09-2026", deadline: "12-09-2026", status: "Pending", priority: "Medium", createdBy: "admin", editedBy: "admin" },
  { task: "Benefits Enrollment", assignedTo: "Jane Smith", department: "HR", startDate: "01-10-2026", deadline: "15-10-2026", status: "Pending", priority: "Medium", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Parking Allocation", assignedTo: "John Doe", department: "Admin", startDate: "Daily Basis", deadline: "Daily Basis", status: "In Progress", priority: "Low", createdBy: "admin", editedBy: "johndoe" },
  { task: "Visitor Log Review", assignedTo: "John Doe", department: "Admin", startDate: "Daily Basis", deadline: "Daily Basis", status: "In Progress", priority: "Low", createdBy: "admin", editedBy: "johndoe" },
  { task: "Canteen Feedback", assignedTo: "Jane Smith", department: "HR", startDate: "Daily Basis", deadline: "Daily Basis", status: "In Progress", priority: "Low", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Compliance Training", assignedTo: "Jane Smith", department: "HR", startDate: "15-09-2026", deadline: "25-09-2026", status: "Pending", priority: "High", createdBy: "admin", editedBy: "hrmanager" },
  { task: "Archive Cleanup", assignedTo: "John Doe", department: "Admin", startDate: "20-09-2026", deadline: "28-09-2026", status: "Pending", priority: "Low", createdBy: "admin", editedBy: "admin" },
  { task: "Performance Review Prep", assignedTo: "Jane Smith", department: "HR", startDate: "01-12-2026", deadline: "31-12-2026", status: "Pending", priority: "High", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Office Supply Audit", assignedTo: "John Doe", department: "Admin", startDate: "05-09-2026", deadline: "10-09-2026", status: "Pending", priority: "Medium", createdBy: "admin", editedBy: "admin" },
  { task: "Internship Program", assignedTo: "Jane Smith", department: "HR", startDate: "01-06-2026", deadline: "30-06-2026", status: "Completed", priority: "Medium", createdBy: "admin", editedBy: "hrmanager" },
  { task: "Data Backup Verification", assignedTo: "John Doe", department: "Admin", startDate: "Weekly Basis", deadline: "Weekly Basis", status: "In Progress", priority: "High", createdBy: "admin", editedBy: "johndoe" },
  { task: "Travel Reimbursement", assignedTo: "Jane Smith", department: "HR", startDate: "01-09-2026", deadline: "10-09-2026", status: "Overdue", priority: "Medium", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Security Camera Check", assignedTo: "John Doe", department: "Admin", startDate: "Daily Basis", deadline: "Daily Basis", status: "In Progress", priority: "Medium", createdBy: "admin", editedBy: "johndoe" },
  { task: "Quarterly Report", assignedTo: "Jane Smith", department: "HR", startDate: "01-10-2026", deadline: "10-10-2026", status: "On Hold", priority: "High", createdBy: "admin", editedBy: "hrmanager" },
  { task: "First Aid Kit Check", assignedTo: "John Doe", department: "Admin", startDate: "Monthly Basis", deadline: "Monthly Basis", status: "In Progress", priority: "Low", createdBy: "admin", editedBy: "johndoe" },
  { task: "Expense Report Audit", assignedTo: "Jane Smith", department: "HR", startDate: "15-08-2026", deadline: "25-08-2026", status: "Completed", priority: "Medium", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Workstation Deep Clean", assignedTo: "John Doe", department: "Admin", startDate: "Monthly Basis", deadline: "Monthly Basis", status: "In Progress", priority: "Low", createdBy: "admin", editedBy: "johndoe" },
  { task: "Team Building Event", assignedTo: "Jane Smith", department: "HR", startDate: "20-09-2026", deadline: "30-09-2026", status: "Pending", priority: "Medium", createdBy: "admin", editedBy: "hrmanager" },
  { task: "Mail Room Sorting", assignedTo: "John Doe", department: "Admin", startDate: "Daily Basis", deadline: "Daily Basis", status: "In Progress", priority: "Low", createdBy: "admin", editedBy: "johndoe" },
  { task: "Diversity Workshop", assignedTo: "Jane Smith", department: "HR", startDate: "05-09-2026", deadline: "08-09-2026", status: "Pending", priority: "Medium", createdBy: "hrmanager", editedBy: "hrmanager" },
  { task: "Key Card Management", assignedTo: "John Doe", department: "Admin", startDate: "Daily Basis", deadline: "Daily Basis", status: "In Progress", priority: "Medium", createdBy: "admin", editedBy: "johndoe" },
  { task: "Exit Interview Schedule", assignedTo: "Jane Smith", department: "HR", startDate: "08-09-2026", deadline: "15-09-2026", status: "Pending", priority: "High", createdBy: "admin", editedBy: "hrmanager" },
  { task: "Emergency Evacuation Plan", assignedTo: "John Doe", department: "Admin", startDate: "01-09-2026", deadline: "20-09-2026", status: "In Progress", priority: "High", createdBy: "admin", editedBy: "admin" }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Task.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed users
    for (const userData of DEFAULT_USERS) {
      await User.create(userData);
    }
    console.log(`✅ Seeded ${DEFAULT_USERS.length} users`);

    // Seed tasks
    await Task.insertMany(DEFAULT_TASKS);
    console.log(`✅ Seeded ${DEFAULT_TASKS.length} tasks`);

    // Seed initial activity log
    await ActivityLog.create({
      type: 'login',
      msg: 'Database seeded with default data',
      user: 'System'
    });
    console.log('✅ Seeded activity log');

    console.log('\n🎉 Database seeded successfully!');
    console.log('Default credentials:');
    console.log('  Admin: admin / admin123');
    console.log('  HR Manager: hrmanager / hr123');
    console.log('  John Doe: johndoe / john123');
    console.log('  Jane Smith: janesmith / jane123');
    console.log('  Viewer: viewer1 / view123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
