import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData } from '../dataManager.js';

const router = express.Router();

// Get all branches
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.branches);
});

// Get branch by ID
router.get('/:branchId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  branch ? res.json(branch) : res.status(404).json({ error: 'Branch not found' });
});

// Create new branch
router.post('/', (req, res) => {
  const data = readData();
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Branch name is required' });
  }

  // Generate a unique ID for the new branch
  const newBranchId = uuidv4();

  const newBranch = {
    id: newBranchId,
    name: name,
    description: description || '',
    semesters: []
  };

  data.branches.push(newBranch);

  writeData(data)
    ? res.status(201).json(newBranch) // Return the full new branch object including the generated ID
    : res.status(500).json({ error: 'Failed to save branch' });
});

// Delete branch
router.delete('/:branchId', (req, res) => {
  const data = readData();
  const branchIndex = data.branches.findIndex(b => b.id === req.params.branchId);
  
  if (branchIndex === -1) return res.status(404).json({ error: 'Branch not found' });
  
  data.branches.splice(branchIndex, 1);
  writeData(data)
    ? res.status(204).end()
    : res.status(500).json({ error: 'Failed to delete branch' });
});

export default router;