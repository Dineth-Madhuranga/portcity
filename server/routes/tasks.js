const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

// Helper to check if user can edit a task
const canEdit = (user, task) => {
  if (user.role === 'Admin') return true;
  if (user.role === 'Viewer') return false;
  // Regular users can only edit tasks they created
  return task.createdBy === user.loginId;
};

// Build query filter based on role
const getTaskFilter = (user) => {
  if (user.role === 'Admin') return {}; // Admin sees all
  if (user.role === 'Viewer') return {}; // Viewer sees all (read-only)
  // Regular User: only their own tasks
  return { createdBy: user.loginId };
};

// @route GET /api/tasks
router.get('/', protect, async (req, res) => {
  try {
    const filter = getTaskFilter(req.user);
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route POST /api/tasks
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'Viewer') {
      return res.status(403).json({ message: 'Viewers cannot create tasks' });
    }

    const { task, assignedTo, department, startDate, deadline, priority } = req.body;
    if (!task || !assignedTo) {
      return res.status(400).json({ message: 'Task Name and Assigned To are required' });
    }

    const newTask = await Task.create({
      task,
      assignedTo,
      department: department || 'Admin',
      startDate: startDate || '',
      deadline: deadline || '',
      priority: priority || 'Medium',
      status: 'Pending',
      createdBy: req.user.loginId,
      editedBy: req.user.loginId
    });

    await ActivityLog.create({
      type: 'add',
      msg: `added task "${task}" assigned to ${assignedTo}`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route PUT /api/tasks/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!canEdit(req.user, task)) {
      return res.status(403).json({ message: 'You cannot edit this task' });
    }

    const allowedFields = ['task', 'assignedTo', 'department', 'startDate', 'deadline', 'status', 'priority'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    updates.editedBy = req.user.loginId;
    updates.editedAt = new Date();

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    // Log the specific change
    const changedField = Object.keys(req.body).find(k => allowedFields.includes(k));
    if (changedField) {
      await ActivityLog.create({
        type: changedField === 'status' ? 'status' : 'edit',
        msg: `edited "${changedField}" on "${updatedTask.task}"`,
        user: req.user.displayName,
        userId: req.user.loginId
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route DELETE /api/tasks/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!canEdit(req.user, task) && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'You cannot delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      type: 'delete',
      msg: `deleted task "${task.task}"`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route DELETE /api/tasks/bulk/delete
router.post('/bulk/delete', protect, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) {
      return res.status(400).json({ message: 'No task IDs provided' });
    }

    const tasks = await Task.find({ _id: { $in: ids } });
    const deletable = tasks.filter(t => canEdit(req.user, t) || req.user.role === 'Admin');
    const blocked = tasks.length - deletable.length;

    if (!deletable.length) {
      return res.status(403).json({ message: 'You cannot delete the selected tasks' });
    }

    const deletableIds = deletable.map(t => t._id);
    await Task.deleteMany({ _id: { $in: deletableIds } });

    await ActivityLog.create({
      type: 'delete',
      msg: `bulk deleted ${deletable.length} task(s)`,
      user: req.user.displayName,
      userId: req.user.loginId
    });

    res.json({ deleted: deletable.length, blocked, message: `Deleted ${deletable.length} tasks` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
