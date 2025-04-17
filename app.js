import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (form data)
app.use(express.json()); // Parse JSON bodies (optional for this setup)
app.use(cors()); // Enable CORS

// --- Data Handling ---
function loadData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            console.warn("data.json not found. Creating an empty structure.");
            // Create a basic empty structure if file doesn't exist
            const initialData = { branches: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
            return initialData;
        }
        const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error("Error loading data:", error);
        return { branches: [] }; // Return empty on error
    }
}

function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8'); // Pretty print JSON
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

function findSubject(data, branchId, semesterId, subjectId) {
    const branch = data.branches.find(b => b.id === branchId);
    if (!branch) return null;
    const semester = branch.semesters.find(s => s.id === semesterId);
    if (!semester) return null;
    const subject = semester.subjects.find(sub => sub.id === subjectId);
    return subject; // Returns the subject object or undefined
}

// --- API Routes ---
// Get all data
app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
});

// Update all data (replace)
app.post('/api/data', (req, res) => {
    const newData = req.body;
    saveData(newData);
    res.json({ status: 'success' });
});

// --- Branch CRUD ---
// Create branch
app.post('/api/branch', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Branch name required' });
    const data = loadData();
    const id = uuidv4();
    data.branches.push({ id, name, semesters: [] });
    saveData(data);
    res.json({ status: 'created', branch: { id, name } });
});
// Delete branch
app.delete('/api/branch/:branchId', (req, res) => {
    const { branchId } = req.params;
    const data = loadData();
    data.branches = data.branches.filter(b => b.id !== branchId);
    saveData(data);
    res.json({ status: 'deleted' });
});

// --- Semester CRUD ---
// Create semester
app.post('/api/semester/:branchId', (req, res) => {
    const { branchId } = req.params;
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Semester number required' });
    const data = loadData();
    const branch = data.branches.find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    const id = uuidv4();
    branch.semesters.push({ id, number, subjects: [] });
    saveData(data);
    res.json({ status: 'created', semester: { id, number } });
});
// Delete semester
app.delete('/api/semester/:branchId/:semesterId', (req, res) => {
    const { branchId, semesterId } = req.params;
    const data = loadData();
    const branch = data.branches.find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    branch.semesters = branch.semesters.filter(s => s.id !== semesterId);
    saveData(data);
    res.json({ status: 'deleted' });
});

// --- Subject CRUD ---
// Create subject
app.post('/api/subject/:branchId/:semesterId', (req, res) => {
    const { branchId, semesterId } = req.params;
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Subject name and code required' });
    const data = loadData();
    const branch = data.branches.find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    const semester = branch.semesters.find(s => s.id === semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    const id = uuidv4();
    semester.subjects.push({ id, name, code, questions: [] });
    saveData(data);
    res.json({ status: 'created', subject: { id, name, code } });
});
// Delete subject
app.delete('/api/subject/:branchId/:semesterId/:subjectId', (req, res) => {
    const { branchId, semesterId, subjectId } = req.params;
    const data = loadData();
    const branch = data.branches.find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    const semester = branch.semesters.find(s => s.id === semesterId);
    if (!semester) return res.status(404).json({ error: 'Semester not found' });
    semester.subjects = semester.subjects.filter(sub => sub.id !== subjectId);
    saveData(data);
    res.json({ status: 'deleted' });
});


// Add a New Question
app.post('/add_question/:branchId/:semesterId/:subjectId', (req, res) => {
    const { branchId, semesterId, subjectId } = req.params;
    const { year, qNumber, chapter, text, type, marks, options } = req.body;
    const data = loadData();
    const subject = findSubject(data, branchId, semesterId, subjectId);

    if (!subject) {
        console.error(`Subject not found: ${branchId}/${semesterId}/${subjectId}`);
        return res.redirect('/?error=Subject not found');
    }

    if (!year || !qNumber || !text || !type || !marks) {
        console.error("Missing required fields for new question:", req.body);
        return res.redirect(`/?error=Missing required fields for new question in ${subject.name}`);
    }

    try {
        const newQuestion = {
            // Use UUID for a more robust unique ID
            questionId: uuidv4(), // Globally unique question ID
            year: parseInt(year, 10),
            qNumber: qNumber,
            chapter: chapter || null, // Store null if chapter is empty
            text: text,
            type: type,
            marks: parseInt(marks, 10)
        };

        // Handle MCQ options
        if (type.toUpperCase() === 'MCQ' && options) {
            newQuestion.options = options.split('\n') // Split options by newline
                                      .map(opt => opt.trim()) // Trim whitespace
                                      .filter(opt => opt); // Remove empty lines
        }

        if (!subject.questions) {
            subject.questions = []; // Initialize if questions array doesn't exist
        }

        subject.questions.push(newQuestion);
        subject.questions.sort((a, b) => a.year - b.year || a.qNumber.localeCompare(b.qNumber)); // Optional: sort questions
        saveData(data);
        console.log(`Question added to ${subject.name}: ${newQuestion.questionId}`);
        res.redirect(`/?message=Question added successfully to ${subject.name}`);

    } catch (error) {
        console.error("Error adding question:", error);
        res.redirect(`/?error=Error adding question: ${error.message}`);
    }
});

// Delete a Question
app.post('/delete_question/:branchId/:semesterId/:subjectId/:questionId', (req, res) => {
    const { branchId, semesterId, subjectId, questionId } = req.params;
    const data = loadData();
    const subject = findSubject(data, branchId, semesterId, subjectId);

    if (!subject || !subject.questions) {
        console.error(`Subject or questions not found for deletion: ${branchId}/${semesterId}/${subjectId}`);
        return res.redirect('/?error=Subject or questions not found');
    }

    const initialLength = subject.questions.length;
    subject.questions = subject.questions.filter(q => q.questionId !== questionId);

    if (subject.questions.length < initialLength) {
        saveData(data);
        console.log(`Question deleted: ${questionId}`);
        res.redirect('/?message=Question deleted successfully');
    } else {
        console.warn(`Question not found for deletion: ${questionId}`);
        res.redirect('/?error=Question not found for deletion');
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
