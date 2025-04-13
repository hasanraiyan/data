import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Branches from './pages/Branches';
import BranchDetails from './pages/BranchDetails';
import SemesterDetails from './pages/SemesterDetails';
import SubjectDetails from './pages/SubjectDetails';

function App() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches');
        setBranches(response.data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Branches branches={branches} />} />
            <Route path="/branches/:branchId" element={<BranchDetails />} />
            <Route path="/branches/:branchId/semesters/:semesterId" element={<SemesterDetails />} />
            <Route path="/branches/:branchId/semesters/:semesterId/subjects/:subjectId" element={<SubjectDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;