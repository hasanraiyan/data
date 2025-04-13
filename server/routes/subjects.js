import express from 'express';
import { readData, writeData } from '../dataManager.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router({ mergeParams: true });

// Create subject in semester
router.post('/', (req, res) => {
    const data = readData();
    const branch = data.branches.find(b => b.id === req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const semester = branch.semesters.find(s => s.id === req.params.semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const { name, code } = req.body;
    if (!name || !code) {
        return res.status(400).json({ error: 'Subject name and code are required' });
    }

    const newSubject = {
        id: uuidv4(),
        name,
        code,
        questions: []
    };

    semester.subjects.push(newSubject);

    writeData(data)
        ? res.status(201).json(newSubject)
        : res.status(500).json({ error: 'Failed to save subject' });
});

// Get subject details
router.get('/:subjectId', (req, res) => {
    const data = readData();
    const branch = data.branches.find(b => b.id === req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const semester = branch.semesters.find(s => s.id === req.params.semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const subject = semester.subjects.find(s => s.id === req.params.subjectId);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    res.json(subject);
});

// Delete subject from semester
router.delete('/:subjectId', (req, res) => {
    const data = readData();
    const branch = data.branches.find(b => b.id === req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const semester = branch.semesters.find(s => s.id === req.params.semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const subjectIndex = semester.subjects.findIndex(s => s.id === req.params.subjectId);
    if (subjectIndex === -1) return res.status(404).json({ error: 'Subject not found' });

    semester.subjects.splice(subjectIndex, 1);
    writeData(data)
        ? res.status(204).end()
        : res.status(500).json({ error: 'Failed to delete subject' });
});

export default router;
