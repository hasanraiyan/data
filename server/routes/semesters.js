import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData } from '../dataManager.js';

const router = express.Router({ mergeParams: true });

// Create semester in branch
router.post('/', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);

  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const { number } = req.body;
  if (!number) {
    return res.status(400).json({ error: 'Semester number is required' });
  }

  const newSemesterId = uuidv4();

  const newSemester = {
    id: newSemesterId,
    number: number,
    subjects: []
  };

  branch.semesters.push(newSemester);

  writeData(data)
    ? res.status(201).json(newSemester)
    : res.status(500).json({ error: 'Failed to save semester' });
});

// Get semester details
router.get('/:semesterId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  if (!semester) return res.status(404).json({ error: 'Semester not found' });

  res.json(semester);
});

// Delete semester from branch
router.delete('/:semesterId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const semesterIndex = branch.semesters.findIndex(s => s.id === req.params.semesterId);
  if (semesterIndex === -1) return res.status(404).json({ error: 'Semester not found' });

  branch.semesters.splice(semesterIndex, 1);
  writeData(data)
    ? res.status(204).end()
    : res.status(500).json({ error: 'Failed to delete semester' });
});

export default router;