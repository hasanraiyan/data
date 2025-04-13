import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  PlusCircle,
  Loader2,
  Trash2,
  BookOpen, // Icon for Subject/Subjects
  List,       // Icon for List view
  ExternalLink, // Icon for links
  AlertCircle, // Icon for empty/alert states
  GraduationCap, // Icon for Semester
  ArrowLeft    // Icon for Back links
} from 'lucide-react';

function SemesterDetails() {
  const { branchId, semesterId } = useParams();
  const [semester, setSemester] = useState(null);
  // Removed 'id' from initial state - assuming backend generates it
  const [newSubject, setNewSubject] = useState({ name: '', code: '' });

  const [isLoading, setIsLoading] = useState(true); // Loading state for initial fetch
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for form submission
  const [isDeleting, setIsDeleting] = useState(null); // Track which subject is being deleted

  // --- Fetch Semester Data ---
  const fetchSemester = async () => {
    // No need to setIsLoading(true) here if called only from useEffect
    try {
      const response = await axios.get(`/api/branches/${branchId}/semesters/${semesterId}`); // Use proxy path
       // Initialize subjects array if it's missing in the response
      setSemester({ ...response.data, subjects: response.data.subjects || [] });
    } catch (error) {
      console.error('Error fetching semester:', error);
      toast.error(error.response?.data?.error || 'Failed to load semester details.');
      setSemester(null); // Set to null on error to show error message
    } finally {
       setIsLoading(false); // Set loading false after attempt
    }
  };

  useEffect(() => {
    setIsLoading(true); // Set loading true when effect runs
    fetchSemester();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, semesterId]); // Dependencies for re-fetching if route changes

  // --- Form Input Change Handler ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubject({ ...newSubject, [name]: value });
  };

  // --- Handle Subject Creation ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate only name and code now
    if (!newSubject.name || !newSubject.code) {
        toast.error('Subject Name and Code are required.');
        return;
    }
    setIsSubmitting(true);
    const loadingToastId = toast.loading('Creating subject...');
    try {
      // Assuming the API returns the full new subject object including the generated ID
      const response = await axios.post(`/api/branches/${branchId}/semesters/${semesterId}/subjects`, newSubject); // Use proxy path
      const createdSubject = response.data;

      toast.success('Subject created successfully!', { id: loadingToastId });

      // --- UPDATE STATE DIRECTLY ---
      setSemester(prevSemester => ({
          ...prevSemester,
          subjects: [...(prevSemester?.subjects || []), createdSubject] // Add new subject to the list
      }));

      setNewSubject({ name: '', code: '' }); // Reset form

    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error(error.response?.data?.error || 'Failed to create subject.', { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handle Subject Deletion ---
  const handleDelete = async (subjectId, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subjectName}" (${subjectId})?`)) {
      return;
    }
    setIsDeleting(subjectId);
    const loadingToastId = toast.loading(`Deleting subject "${subjectName}"...`);
    try {
      await axios.delete(`/api/branches/${branchId}/semesters/${semesterId}/subjects/${subjectId}`); // Use proxy path
      toast.success(`Subject "${subjectName}" deleted successfully!`, { id: loadingToastId });

      // --- UPDATE STATE DIRECTLY ---
      setSemester(prevSemester => ({
          ...prevSemester,
          subjects: prevSemester.subjects.filter(subject => subject.id !== subjectId) // Filter out deleted subject
      }));

    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error(error.response?.data?.error || `Failed to delete subject "${subjectName}".`, { id: loadingToastId });
    } finally {
      setIsDeleting(null);
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg text-gray-600">Loading Semester Details...</span>
      </div>
    );
  }

  // --- Error State ---
  if (!semester) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700">Error Loading Semester</h2>
        <p className="text-gray-600 mt-2">
          The semester details could not be loaded. Please check the URL or try again later.
        </p>
         <Link // Link back to the branch page
            to={`/branches/${branchId}`}
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
          >
            <ArrowLeft className="mr-2 h-4 w-4"/> Back to Branch
          </Link>
      </div>
    );
  }

  // --- Main Content ---
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Make sure Toaster is rendered, preferably in a higher-level component like App.jsx */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Semester Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            {/* TODO: Display Branch Name here if needed - requires fetching branch data or passing it down */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Semester {semester.number}</h1>
        </div>
        <Link
            to={`/branches/${branchId}`}
            className="text-sm text-blue-600 hover:underline inline-flex items-center"
            title="Back to Branch Details"
        >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Branch
        </Link>
      </div>


      {/* Add New Subject Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-blue-600"/>
            Add New Subject
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Name Field */}
            <div>
              <label htmlFor="subject-name" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <input
                id="subject-name"
                type="text"
                name="name"
                value={newSubject.name}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                placeholder="e.g., Data Structures"
              />
            </div>
            {/* Subject Code Field */}
            <div>
              <label htmlFor="subject-code" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <input
                id="subject-code"
                type="text"
                name="code"
                value={newSubject.code}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                placeholder="e.g., CS201"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !!isDeleting} // Disable if submitting or any delete is happening
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {isSubmitting ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
              ) : (
                <> <PlusCircle className="mr-2 h-4 w-4" />Create Subject</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Subjects List Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
           <List className="h-6 w-6 text-blue-600" />
           <h2 className="text-2xl font-semibold text-gray-800">Subjects</h2>
         </div>

        {/* Check specifically for the subjects array length */}
        {semester.subjects?.length === 0 ? (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-md border border-gray-200">
             <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-600 text-lg">No subjects found for this semester.</p>
            <p className="text-sm text-gray-500 mt-1">Use the form above to add the first subject.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {semester.subjects.map(subject => (
                  <tr key={subject.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                    {/* Subject Code */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">{subject.code}</td>
                    {/* Subject Name as Link */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <Link
                        to={`/branches/${branchId}/semesters/${semesterId}/subjects/${subject.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
                        title={`View questions for ${subject.name}`}
                      >
                        <BookOpen className="mr-2 h-4 w-4 opacity-70" /> {/* Optional: Icon for subject name */}
                        {subject.name}
                        <ExternalLink className="ml-1.5 h-3 w-3 flex-shrink-0 opacity-60" />
                      </Link>
                    </td>
                    {/* Delete Action */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDelete(subject.id, subject.name)}
                        disabled={isDeleting === subject.id || isSubmitting} // Disable if deleting this OR if submitting form
                        aria-label={`Delete subject ${subject.name}`}
                        className={`p-2 rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out ${isDeleting === subject.id ? 'cursor-wait' : ''}`}
                      >
                        {isDeleting === subject.id ? (
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

export default SemesterDetails;
