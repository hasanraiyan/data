import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData } from '../dataManager.js';

const router = express.Router({ mergeParams: true });

// Create question in subject
router.post('/', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  if (!semester) return res.status(404).json({ error: 'Semester not found' });

  const subject = semester.subjects.find(s => s.id === req.params.subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const { text, type, year, qNumber, chapter, marks } = req.body;

  if (!text || !type) {
    return res.status(400).json({ error: 'Text and type are required' });
  }

  // Optional: prevent duplicate questions by text
  if (subject.questions.some(q => q.text === text)) {
    return res.status(400).json({ error: 'Duplicate question text' });
  }

  const newQuestion = {
    questionId: uuidv4(),
    year: year || new Date().getFullYear(),
    qNumber: qNumber || '',
    chapter: chapter || '',
    text,
    type,
    marks: marks || 1
  };

  subject.questions.push(newQuestion);

  writeData(data)
    ? res.status(201).json(newQuestion)
    : res.status(500).json({ error: 'Failed to save question' });
});

// Delete question from subject
router.delete('/:questionId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  if (!semester) return res.status(404).json({ error: 'Semester not found' });

  const subject = semester.subjects.find(s => s.id === req.params.subjectId);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  const questionIndex = subject.questions.findIndex(q => q.questionId === req.params.questionId);
  if (questionIndex === -1) return res.status(404).json({ error: 'Question not found' });

  subject.questions.splice(questionIndex, 1);

  writeData(data)
    ? res.status(204).end()
    : res.status(500).json({ error: 'Failed to delete question' });
});

export default router;
