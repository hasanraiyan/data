// --- State ---
let selectedBranch = null;
let selectedSemester = null;
let selectedSubject = null;

function showMessage(msg, type = 'success') {
  document.getElementById('messages').innerHTML = `<div class="${type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} px-4 py-3 rounded relative mb-4">${msg}</div>`;
  setTimeout(() => { document.getElementById('messages').innerHTML = ''; }, 2000);
}

async function fetchData() {
  const res = await fetch('/api/data');
  if (!res.ok) {
    showMessage('Failed to load data.', 'error');
    return;
  }
  const data = await res.json();
  renderNavigation(data);
}

function renderNavigation(data) {
  const container = document.getElementById('dashboard');
  let html = '';
  // Branch selection
  html += `<h2 class="text-xl font-bold mb-2">1. Select Branch</h2>`;
  html += `<div class="flex flex-wrap gap-2 mb-4">`;
  data.branches.forEach(branch => {
    html += `<button class="px-3 py-2 bg-blue-100 rounded hover:bg-blue-200 ${selectedBranch && selectedBranch.id === branch.id ? 'font-bold border border-blue-400' : ''}" onclick="selectBranch('${branch.id}')">${branch.name}</button>`;
    html += `<button class="ml-1 text-xs text-red-500" onclick="deleteBranchPrompt('${branch.id}', '${branch.name}')">🗑️</button>`;
  });
  html += `<button class="px-3 py-2 bg-green-100 rounded hover:bg-green-200" onclick="showCreateBranchForm()">+ Add Branch</button>`;
  html += `</div>`;

  // Semester selection
  if (selectedBranch) {
    const branch = data.branches.find(b => b.id === selectedBranch.id);
    html += `<h2 class="text-lg font-semibold mb-2">2. Select Semester</h2>`;
    html += `<div class="flex flex-wrap gap-2 mb-4">`;
    branch.semesters.forEach(semester => {
      html += `<button class="px-3 py-2 bg-purple-100 rounded hover:bg-purple-200 ${selectedSemester && selectedSemester.id === semester.id ? 'font-bold border border-purple-400' : ''}" onclick="selectSemester('${semester.id}')">Semester ${semester.number}</button>`;
      html += `<button class="ml-1 text-xs text-red-500" onclick="deleteSemesterPrompt('${branch.id}', '${semester.id}', '${semester.number}')">🗑️</button>`;
    });
    html += `<button class="px-3 py-2 bg-green-100 rounded hover:bg-green-200" onclick="showCreateSemesterForm('${branch.id}')">+ Add Semester</button>`;
    html += `</div>`;
  }

  // Subject selection
  if (selectedBranch && selectedSemester) {
    const branch = data.branches.find(b => b.id === selectedBranch.id);
    const semester = branch.semesters.find(s => s.id === selectedSemester.id);
    html += `<h2 class="text-lg font-semibold mb-2">3. Select Subject</h2>`;
    html += `<div class="flex flex-wrap gap-2 mb-4">`;
    semester.subjects.forEach(subject => {
      html += `<button class="px-3 py-2 bg-yellow-100 rounded hover:bg-yellow-200 ${selectedSubject && selectedSubject.id === subject.id ? 'font-bold border border-yellow-400' : ''}" onclick="selectSubject('${subject.id}')">${subject.name}</button>`;
      html += `<button class="ml-1 text-xs text-red-500" onclick="deleteSubjectPrompt('${branch.id}', '${semester.id}', '${subject.id}', '${subject.name}')">🗑️</button>`;
    });
    html += `<button class="px-3 py-2 bg-green-100 rounded hover:bg-green-200" onclick="showCreateSubjectForm('${branch.id}', '${semester.id}')">+ Add Subject</button>`;
    html += `</div>`;
  }

  // Question view and create
  if (selectedBranch && selectedSemester && selectedSubject) {
    html += `<h2 class="text-lg font-semibold mb-2">4. Questions</h2>`;
    html += `<div id="questionsArea"></div>`;
    html += `<button class="px-3 py-2 bg-green-100 rounded hover:bg-green-200 mb-4" onclick="showCreateQuestionForm()">+ Add Question</button>`;
  }

  container.innerHTML = html;
  if (selectedBranch && selectedSemester && selectedSubject) {
    renderQuestions(data);
  }
}

// Branch CRUD
function showCreateBranchForm() {
  const name = prompt('Enter branch name:');
  if (!name) return;
  fetch('/api/branch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(r => r.json()).then(res => {
    if (res.error) showMessage(res.error, 'error');
    else { showMessage('Branch created!'); selectedBranch = { id: res.branch.id }; selectedSemester = null; selectedSubject = null; fetchData(); }
  });
}
function deleteBranchPrompt(branchId, branchName) {
  if (confirm(`Delete branch '${branchName}' and all its data?`)) {
    fetch(`/api/branch/${branchId}`, { method: 'DELETE' }).then(r => r.json()).then(() => {
      showMessage('Branch deleted!'); selectedBranch = null; selectedSemester = null; selectedSubject = null; fetchData();
    });
  }
}
function selectBranch(branchId) {
  selectedBranch = { id: branchId };
  selectedSemester = null;
  selectedSubject = null;
  fetchData();
}

// Semester CRUD
function showCreateSemesterForm(branchId) {
  const number = prompt('Enter semester number:');
  if (!number) return;
  fetch(`/api/semester/${branchId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ number })
  }).then(r => r.json()).then(res => {
    if (res.error) showMessage(res.error, 'error');
    else { showMessage('Semester created!'); selectedSemester = { id: res.semester.id }; selectedSubject = null; fetchData(); }
  });
}
function deleteSemesterPrompt(branchId, semesterId, semesterNumber) {
  if (confirm(`Delete semester ${semesterNumber} and all its data?`)) {
    fetch(`/api/semester/${branchId}/${semesterId}`, { method: 'DELETE' }).then(r => r.json()).then(() => {
      showMessage('Semester deleted!'); selectedSemester = null; selectedSubject = null; fetchData();
    });
  }
}
function selectSemester(semesterId) {
  selectedSemester = { id: semesterId };
  selectedSubject = null;
  fetchData();
}

// Subject CRUD
function showCreateSubjectForm(branchId, semesterId) {
  const name = prompt('Enter subject name:');
  if (!name) return;
  const code = prompt('Enter subject code:');
  if (!code) return;
  fetch(`/api/subject/${branchId}/${semesterId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, code })
  }).then(r => r.json()).then(res => {
    if (res.error) showMessage(res.error, 'error');
    else { showMessage('Subject created!'); selectedSubject = { id: res.subject.id }; fetchData(); }
  });
}
function deleteSubjectPrompt(branchId, semesterId, subjectId, subjectName) {
  if (confirm(`Delete subject '${subjectName}' and all its questions?`)) {
    fetch(`/api/subject/${branchId}/${semesterId}/${subjectId}`, { method: 'DELETE' }).then(r => r.json()).then(() => {
      showMessage('Subject deleted!'); selectedSubject = null; fetchData();
    });
  }
}
function selectSubject(subjectId) {
  selectedSubject = { id: subjectId };
  fetchData();
}

// Questions Render & Add
function renderQuestions(data) {
  const branch = data.branches.find(b => b.id === selectedBranch.id);
  const semester = branch.semesters.find(s => s.id === selectedSemester.id);
  const subject = semester.subjects.find(sub => sub.id === selectedSubject.id);
  let html = '';
  if (!subject.questions || subject.questions.length === 0) {
    html = '<p class="text-gray-500 text-sm">No questions found for this subject.</p>';
  } else {
    subject.questions.forEach(q => {
      html += `<div class="border border-gray-200 rounded p-3 relative bg-white hover:shadow-sm transition-shadow duration-150 mb-2">
        <p class="text-xs text-gray-500 mb-1">
          <span class="font-semibold">ID:</span> ${q.questionId} |
          <span class="font-semibold">Year:</span> ${q.year} |
          <span class="font-semibold">Q#:</span> ${q.qNumber} |
          <span class="font-semibold">Marks:</span> ${q.marks} |
          <span class="font-semibold">Type:</span> ${q.type}
        </p>`;
      if (q.chapter) {
        html += `<p class="text-xs text-gray-500 mb-2"><span class="font-semibold">Module/Chapter:</span> ${q.chapter}</p>`;
      }
      html += `<div class="text-sm text-gray-800 mt-1 question-content">${q.text.replace(/\n/g, '<br>')}</div>`;
      if (q.type && q.type.toUpperCase() === 'MCQ' && q.options && q.options.length > 0) {
        html += `<div class="mt-2"><p class="text-xs font-semibold text-gray-600">Options:</p><ul class="list-disc list-inside text-sm text-gray-700 pl-4">`;
        q.options.forEach(opt => {
          html += `<li>${opt}</li>`;
        });
        html += `</ul></div>`;
      }
      html += `<form class="absolute top-2 right-2" onsubmit="return deleteQuestionPrompt(event, '${branch.id}', '${semester.id}', '${subject.id}', '${q.questionId}')">
        <button type="submit" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-100 transition-colors text-xs">🗑️</button>
      </form>`;
      html += `</div>`;
    });
  }
  document.getElementById('questionsArea').innerHTML = html;
}
function deleteQuestionPrompt(e, branchId, semesterId, subjectId, questionId) {
  e.preventDefault();
  if (confirm('Are you sure you want to delete this question?')) {
    fetch(`/delete_question/${branchId}/${semesterId}/${subjectId}/${questionId}`, { method: 'POST' })
      .then(r => r.text()).then(() => { showMessage('Question deleted!'); fetchData(); });
  }
  return false;
}

function showCreateQuestionForm() {
  let formHtml = `<form id="createQForm" class="mb-4 bg-white p-4 rounded shadow">
    <h3 class="text-lg font-bold mb-2">Add Question</h3>
    <div class="mb-2"><input required name="year" type="number" placeholder="Year" class="border p-2 rounded w-full"></div>
    <div class="mb-2"><input required name="qNumber" type="text" placeholder="Question Number" class="border p-2 rounded w-full"></div>
    <div class="mb-2"><input name="chapter" type="text" placeholder="Module/Chapter (optional)" class="border p-2 rounded w-full"></div>
    <div class="mb-2"><textarea required name="text" placeholder="Question Text" class="border p-2 rounded w-full"></textarea></div>
    <div class="mb-2"><select name="type" class="border p-2 rounded w-full">
      <option value="MCQ">MCQ</option>
      <option value="Short">Short</option>
      <option value="Long">Long</option>
    </select></div>
    <div class="mb-2"><input name="marks" type="number" placeholder="Marks" class="border p-2 rounded w-full"></div>
    <div class="mb-2"><textarea name="options" placeholder="Options (one per line, MCQ only)" class="border p-2 rounded w-full"></textarea></div>
    <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Create</button>
    <button type="button" class="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded" onclick="cancelCreateQuestion()">Cancel</button>
  </form>`;
  document.getElementById('questionsArea').insertAdjacentHTML('afterbegin', formHtml);
  document.getElementById('createQForm').onsubmit = submitCreateQuestionForm;
}
function cancelCreateQuestion() {
  fetchData();
}
function submitCreateQuestionForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    year: form.year.value,
    qNumber: form.qNumber.value,
    chapter: form.chapter.value,
    text: form.text.value,
    type: form.type.value,
    marks: form.marks.value,
    options: form.options.value
  };
  fetch(`/add_question/${selectedBranch.id}/${selectedSemester.id}/${selectedSubject.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.text()).then(() => { showMessage('Question created!'); fetchData(); });
}

document.addEventListener('DOMContentLoaded', fetchData);
