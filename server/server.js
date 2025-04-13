import express from 'express';
import cors from 'cors';
import branchesRouter from './routes/branches.js';
import semestersRouter from './routes/semesters.js';
import subjectsRouter from './routes/subjects.js';
import questionsRouter from './routes/questions.js';
import { readData, writeData } from './dataManager.js';
import dotenv from 'dotenv'

dotenv.config()

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());


app.use(cors());

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

app.use('/api/branches', branchesRouter);
app.use('/api/branches/:branchId/semesters', semestersRouter);
app.use('/api/branches/:branchId/semesters/:semesterId/subjects', subjectsRouter);
app.use('/api/branches/:branchId/semesters/:semesterId/subjects/:subjectId/questions', questionsRouter);



// Get all branches
app.get('/api/branches', (req, res) => {
  const data = readData();
  res.json(data.branches);
});

// Get branch by ID
app.get('/api/branches/:branchId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (branch) {
    res.json(branch);
  } else {
    res.status(404).json({ error: 'Branch not found' });
  }
});

// Get semesters for a branch
app.get('/api/branches/:branchId/semesters', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (branch) {
    res.json(branch.semesters);
  } else {
    res.status(404).json({ error: 'Branch not found' });
  }
});

// Get subjects for a semester
app.get('/api/branches/:branchId/semesters/:semesterId/subjects', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  if (semester) {
    res.json(semester.subjects);
  } else {
    res.status(404).json({ error: 'Semester not found' });
  }
});

// Get questions for a subject
app.get('/api/branches/:branchId/semesters/:semesterId/subjects/:subjectId/questions', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found' });
  }
  
  const subject = semester.subjects.find(s => s.id === req.params.subjectId);
  if (subject) {
    res.json(subject.questions);
  } else {
    res.status(404).json({ error: 'Subject not found' });
  }
});

// Create a new branch
app.post('/api/branches', (req, res) => {
  const data = readData();
  const newBranch = req.body;
  
  if (!newBranch.id || !newBranch.name) {
    return res.status(400).json({ error: 'Branch ID and name are required' });
  }
  
  if (data.branches.some(b => b.id === newBranch.id)) {
    return res.status(400).json({ error: 'Branch ID already exists' });
  }
  
  data.branches.push({
    id: newBranch.id,
    name: newBranch.name,
    description: newBranch.description || '',
    semesters: []
  });
  
  if (writeData(data)) {
    res.status(201).json(newBranch);
  } else {
    res.status(500).json({ error: 'Failed to save branch' });
  }
});

// Delete a branch
app.delete('/api/branches/:branchId', (req, res) => {
  const data = readData();
  const branchIndex = data.branches.findIndex(b => b.id === req.params.branchId);
  
  if (branchIndex === -1) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  data.branches.splice(branchIndex, 1);
  
  if (writeData(data)) {
    res.status(204).end();
  } else {
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

// Create a semester in a branch
app.post('/api/branches/:branchId/semesters', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const newSemester = req.body;
  
  if (!newSemester.id || !newSemester.number) {
    return res.status(400).json({ error: 'Semester ID and number are required' });
  }
  
  if (branch.semesters.some(s => s.id === newSemester.id)) {
    return res.status(400).json({ error: 'Semester ID already exists' });
  }
  
  branch.semesters.push({
    id: newSemester.id,
    number: newSemester.number,
    subjects: []
  });
  
  if (writeData(data)) {
    res.status(201).json(newSemester);
  } else {
    res.status(500).json({ error: 'Failed to save semester' });
  }
});

// Delete a semester from a branch
app.delete('/api/branches/:branchId/semesters/:semesterId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semesterIndex = branch.semesters.findIndex(s => s.id === req.params.semesterId);
  
  if (semesterIndex === -1) {
    return res.status(404).json({ error: 'Semester not found' });
  }
  
  branch.semesters.splice(semesterIndex, 1);
  
  if (writeData(data)) {
    res.status(204).end();
  } else {
    res.status(500).json({ error: 'Failed to delete semester' });
  }
});

// Create a subject in a semester
app.post('/api/branches/:branchId/semesters/:semesterId/subjects', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found' });
  }
  
  const newSubject = req.body;
  
  if (!newSubject.id || !newSubject.name || !newSubject.code) {
    return res.status(400).json({ error: 'Subject ID, name and code are required' });
  }
  
  if (semester.subjects.some(s => s.id === newSubject.id)) {
    return res.status(400).json({ error: 'Subject ID already exists' });
  }
  
  semester.subjects.push({
    id: newSubject.id,
    name: newSubject.name,
    code: newSubject.code,
    questions: []
  });
  
  if (writeData(data)) {
    res.status(201).json(newSubject);
  } else {
    res.status(500).json({ error: 'Failed to save subject' });
  }
});

// Delete a subject from a semester
app.delete('/api/branches/:branchId/semesters/:semesterId/subjects/:subjectId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found' });
  }
  
  const subjectIndex = semester.subjects.findIndex(s => s.id === req.params.subjectId);
  
  if (subjectIndex === -1) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  
  semester.subjects.splice(subjectIndex, 1);
  
  if (writeData(data)) {
    res.status(204).end();
  } else {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Create a question in a subject
app.post('/api/branches/:branchId/semesters/:semesterId/subjects/:subjectId/questions', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found' });
  }
  
  const subject = semester.subjects.find(s => s.id === req.params.subjectId);
  
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  
  const newQuestion = req.body;
  
  if (!newQuestion.questionId || !newQuestion.text || !newQuestion.type) {
    return res.status(400).json({ error: 'Question ID, text and type are required' });
  }
  
  if (subject.questions.some(q => q.questionId === newQuestion.questionId)) {
    return res.status(400).json({ error: 'Question ID already exists' });
  }
  
  subject.questions.push({
    questionId: newQuestion.questionId,
    year: newQuestion.year || new Date().getFullYear(),
    qNumber: newQuestion.qNumber || '',
    chapter: newQuestion.chapter || '',
    text: newQuestion.text,
    type: newQuestion.type,
    marks: newQuestion.marks || 1
  });
  
  if (writeData(data)) {
    res.status(201).json(newQuestion);
  } else {
    res.status(500).json({ error: 'Failed to save question' });
  }
});

// Delete a question from a subject
app.delete('/api/branches/:branchId/semesters/:semesterId/subjects/:subjectId/questions/:questionId', (req, res) => {
  const data = readData();
  const branch = data.branches.find(b => b.id === req.params.branchId);
  
  if (!branch) {
    return res.status(404).json({ error: 'Branch not found' });
  }
  
  const semester = branch.semesters.find(s => s.id === req.params.semesterId);
  
  if (!semester) {
    return res.status(404).json({ error: 'Semester not found' });
  }
  
  const subject = semester.subjects.find(s => s.id === req.params.subjectId);
  
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' });
  }
  
  const questionIndex = subject.questions.findIndex(q => q.questionId === req.params.questionId);
  
  if (questionIndex === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  subject.questions.splice(questionIndex, 1);
  
  if (writeData(data)) {
    res.status(204).end();
  } else {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});