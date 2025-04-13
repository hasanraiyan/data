import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  PlusCircle,
  Loader2,
  Trash2,
  BookCopy,    // Icon for Subject
  HelpCircle,  // Icon for Question
  List,
  ExternalLink,
  AlertCircle,
  GraduationCap, // Icon for Semester
  ArrowLeft    // Icon for Back links
} from 'lucide-react';

function SubjectDetails() {
  const { branchId, semesterId, subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    // questionId is NOT included here, as backend generates it
    text: '',
    type: 'Explanation', // Default type
    year: new Date().getFullYear(), // Default year
    qNumber: '',
    chapter: '',
    marks: 1 // Default marks
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Store deleting questionId

  // --- Fetch Subject Data ---
  useEffect(() => {
    const fetchSubject = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/branches/${branchId}/semesters/${semesterId}/subjects/${subjectId}`); // Use proxy path
        // Initialize questions array if it's missing
        setSubject({ ...response.data, questions: response.data.questions || [] });
      } catch (err) {
        console.error('Error fetching subject:', err);
        setError(err.response?.data?.error || 'Failed to load subject details. Please try again later.');
        setSubject(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubject();
  }, [branchId, semesterId, subjectId]); // Re-fetch if IDs change

  // --- Form Input Change Handler ---
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : '') : value // Handle number input properly
    }));
  };

  // --- Handle Question Creation ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!newQuestion.text || !newQuestion.type || !newQuestion.year) {
      toast.error('Question Text, Type, and Year are required.');
      return;
    }
    if (newQuestion.marks < 1) {
        toast.error('Marks must be at least 1.');
        return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading('Adding question...');
    try {
      // Send the newQuestion state (which doesn't have questionId)
      // API returns the created question object including the generated ID
      const response = await axios.post(
        `/api/branches/${branchId}/semesters/${semesterId}/subjects/${subjectId}/questions`, // Use proxy path
        {...newQuestion, marks: Number(newQuestion.marks) || 1} // Ensure marks is a number
      );
      const createdQuestion = response.data; // Contains backend-generated questionId

      toast.success('Question added successfully!', { id: loadingToastId });

      // --- UPDATE STATE DIRECTLY ---
      setSubject(prevSubject => ({
        ...prevSubject,
        // Ensure questions array exists before spreading
        questions: [...(prevSubject?.questions || []), createdQuestion]
      }));

      // Reset form
      setNewQuestion({
        text: '', type: 'Explanation', year: new Date().getFullYear(),
        qNumber: '', chapter: '', marks: 1
      });

    } catch (err) {
      console.error('Error creating question:', err);
      toast.error(err.response?.data?.error || 'Failed to add question.', { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handle Question Deletion ---
  const handleDelete = async (questionId, questionText) => {
    // Use the questionId received from the mapped question data
    const confirmText = questionText?.length > 50 ? questionText.substring(0, 50) + '...' : questionText;
    if (!window.confirm(`Are you sure you want to delete the question: "${confirmText}"?`)) {
      return;
    }
    setIsDeleting(questionId);
    const loadingToastId = toast.loading('Deleting question...');
    try {
      // Use the questionId in the URL
      await axios.delete(`/api/branches/${branchId}/semesters/${semesterId}/subjects/${subjectId}/questions/${questionId}`); // Use proxy path
      toast.success('Question deleted successfully!', { id: loadingToastId });

      // --- UPDATE STATE DIRECTLY ---
      setSubject(prevSubject => ({
        ...prevSubject,
        // Filter out the deleted question using its questionId
        questions: prevSubject.questions.filter(q => q.questionId !== questionId)
      }));

    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error(err.response?.data?.error || 'Failed to delete question.', { id: loadingToastId });
    } finally {
      setIsDeleting(null);
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Loading Subject Details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700">Error Loading Subject</h2>
        <p className="text-gray-600 mt-2">{error}</p>
         <Link // Link back to the semester page
            to={`/branches/${branchId}/semesters/${semesterId}`}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Semester
          </Link>
      </div>
    );
  }

   if (!subject) { // Should generally be caught by error state, but good fallback
    return <div className="text-center mt-10 text-gray-600">Subject details not found.</div>;
  }


  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Ensure Toaster is rendered in a parent component */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Subject Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center space-x-3">
            <BookCopy className="h-8 w-8 text-blue-600" />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{subject.name}</h1>
                <span className="text-sm text-gray-500">({subject.code})</span>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <Link
                to={`/branches/${branchId}/semesters/${semesterId}`}
                className="text-sm text-blue-600 hover:underline inline-flex items-center"
                title="Back to Semester"
            >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Semester
            </Link>
             <Link
                to={`/branches/${branchId}`}
                className="text-sm text-blue-600 hover:underline inline-flex items-center"
                title="Back to Branch"
            >
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Branch
            </Link>
        </div>
      </div>

      {/* Add New Question Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-5 flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-blue-600"/>
            Add New Question
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
           {/* Question Text */}
          <div>
            <label htmlFor="question-text" className="block text-sm font-medium text-gray-700 mb-1">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              id="question-text"
              name="text"
              rows="4"
              value={newQuestion.text}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
              placeholder="Enter the question here..."
            />
          </div>

          {/* Grid for other fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Question Type */}
            <div>
              <label htmlFor="question-type" className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="question-type"
                name="type"
                value={newQuestion.type}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 bg-white"
              >
                <option value="Explanation">Explanation</option>
                <option value="List">List</option>
                <option value="Short Answer">Short Answer</option>
                <option value="Long Answer">Long Answer</option>
                <option value="Diagram">Diagram</option>
                <option value="Problem">Problem</option>
                <option value="Definition">Definition</option>
              </select>
            </div>
             {/* Year */}
             <div>
                <label htmlFor="question-year" className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-500">*</span>
                </label>
                <input
                    id="question-year"
                    type="number"
                    name="year"
                    value={newQuestion.year}
                    onChange={handleInputChange}
                    required
                    min="1900" // Sensible minimum year
                    max={new Date().getFullYear() + 1} // Allow next year
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                    placeholder="e.g., 2023"
                />
            </div>
            {/* Question Number */}
             <div>
                <label htmlFor="question-qNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Q. Number (Optional)
                </label>
                <input
                    id="question-qNumber"
                    type="text"
                    name="qNumber"
                    value={newQuestion.qNumber}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                    placeholder="e.g., 1a, II.3"
                />
            </div>
            {/* Chapter */}
            <div>
                <label htmlFor="question-chapter" className="block text-sm font-medium text-gray-700 mb-1">
                    Chapter (Optional)
                </label>
                <input
                    id="question-chapter"
                    type="text"
                    name="chapter"
                    value={newQuestion.chapter}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                    placeholder="e.g., Ch 5, Module 2"
                />
            </div>
             {/* Marks */}
             <div>
                <label htmlFor="question-marks" className="block text-sm font-medium text-gray-700 mb-1">
                    Marks
                </label>
                <input
                    id="question-marks"
                    type="number"
                    name="marks"
                    value={newQuestion.marks}
                    onChange={handleInputChange}
                    min="1"
                    step="0.5" // Allow half marks if needed
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !!isDeleting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {isSubmitting ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding Question...</>
              ) : (
                <> <PlusCircle className="mr-2 h-4 w-4" />Add Question</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Questions List Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
           <List className="h-6 w-6 text-blue-600" />
           <h2 className="text-2xl font-semibold text-gray-800">Questions</h2>
         </div>

        {subject.questions?.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-md border border-gray-200">
             <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-600 text-lg">No questions found for this subject.</p>
            <p className="text-sm text-gray-500 mt-1">Use the form above to add the first question.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Adjust columns based on importance */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Q#</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Question</th> {/* Wider column */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Use question.questionId (backend generated) as the key and for delete */}
                {subject.questions.map(question => (
                  <tr key={question.questionId} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{question.year}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{question.qNumber || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{question.chapter || '-'}</td>
                    {/* Allow text wrapping for question */}
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">{question.text}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{question.type}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{question.marks}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                         // Use question.questionId for delete operation
                        onClick={() => handleDelete(question.questionId, question.text)}
                        disabled={isDeleting === question.questionId || isSubmitting}
                        aria-label={`Delete question: ${question.text.substring(0, 30)}...`}
                        className={`p-2 rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out ${isDeleting === question.questionId ? 'cursor-wait' : ''}`}
                      >
                        {isDeleting === question.questionId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectDetails;
