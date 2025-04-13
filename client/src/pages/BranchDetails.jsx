import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast';
import {
  PlusCircle,
  Trash2,
  Loader2,
  Building,
  GraduationCap, // Using GraduationCap for Semester List
  ExternalLink,
  AlertCircle,
  Inbox // Icon for empty state
} from 'lucide-react';
import '../App.css'
function BranchDetails() {
  const { branchId } = useParams();
  const [branch, setBranch] = useState(null);
  // --- State Change: Removed 'id' from newSemester ---
  const [newSemester, setNewSemester] = useState({ number: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null); // Track which semester ID is being deleted

  const API_BASE_URL = '/api'; // Define base URL for API calls

  const fetchBranch = async () => {
    setIsLoading(true);
    setBranch(null); // Reset branch state before fetching
    try {
      const response = await axios.get(`${API_BASE_URL}/branches/${branchId}`);
      setBranch(response.data);
    } catch (error) {
      console.error('Error fetching branch:', error);
      toast.error(
        error.response?.status === 404
          ? 'Branch not found.'
          : error.response?.data?.error || 'Failed to fetch branch details.'
      );
      // Keep branch as null to show the error component
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]); // Dependency array remains branchId

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers for semester number, prevent leading zeros unless it's just '0'
    if (name === 'number') {
      const numValue = value.replace(/[^0-9]/g, ''); // Remove non-digits
      setNewSemester({ ...newSemester, [name]: numValue });
    } else {
      setNewSemester({ ...newSemester, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newSemester.number || parseInt(newSemester.number, 10) <= 0) {
      toast.error('Please enter a valid Semester Number (must be positive).');
      return;
    }
    setIsSubmitting(true);
    const loadingToastId = toast.loading('Creating semester...');
    try {
      // --- API Call Change: Only send 'number' ---
      await axios.post(`${API_BASE_URL}/branches/${branchId}/semesters`, {
        number: parseInt(newSemester.number, 10) // Ensure number is sent as an integer
      });
      await fetchBranch(); // Refetch data to update the list
      toast.success('Semester created successfully!', { id: loadingToastId });
      // --- State Reset Change: Reset only 'number' ---
      setNewSemester({ number: '' });
    } catch (error) {
      console.error('Error creating semester:', error);
      toast.error(error.response?.data?.error || 'Failed to create semester.', { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (semesterId) => {
    // Use a more robust confirmation dialog if available (e.g., from a UI library)
    // but window.confirm is simple and works
    if (window.confirm(`Are you sure you want to delete Semester ${branch?.semesters?.find(s => s.id === semesterId)?.number ?? semesterId}? This action cannot be undone.`)) {
      setIsDeleting(semesterId); // Set the deleting state to the specific semester ID
      const loadingToastId = toast.loading('Deleting semester...');
      try {
        await axios.delete(`${API_BASE_URL}/branches/${branchId}/semesters/${semesterId}`);
        // Optimistic UI update (optional but good UX):
        // setBranch(prev => ({
        //   ...prev,
        //   semesters: prev.semesters.filter(s => s.id !== semesterId)
        // }));
        // Or refetch for consistency:
        await fetchBranch();
        toast.success('Semester deleted successfully!', { id: loadingToastId });
      } catch (error) {
        console.error('Error deleting semester:', error);
        toast.error(error.response?.data?.error || 'Failed to delete semester.', { id: loadingToastId });
        // If optimistic update was used, refetch here on error to revert
        // await fetchBranch();
      } finally {
        setIsDeleting(null); // Reset deleting state
      }
    }
  };

  // --- Enhanced Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] text-center p-6 bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-lg font-medium text-gray-700">Loading Branch Details...</p>
        <p className="text-sm text-gray-500">Please wait a moment.</p>
      </div>
    );
  }

  // --- Enhanced Error State ---
  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-lg mx-auto mt-10">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-800">Error Loading Branch</h2>
        <p className="text-gray-700 mt-2 mb-6">
          We couldn't fetch the details for this branch. It might not exist or there was a network issue.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Go Back
        </button>
      </div>
    );
  }

  // --- Main Content ---
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <Toaster position="top-center" reverseOrder={false} />

        {/* Branch Header */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-start space-x-5">
          <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
            <Building className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{branch.name}</h1>
            {branch.description && (
              <p className="text-base text-gray-600 mt-1">{branch.description}</p>
            )}
          </div>
        </div>

        {/* Add New Semester Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 border-b border-gray-200 pb-3">Add New Semester</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- Form Change: Removed ID input, updated number input --- */}
            <div>
              <label htmlFor="semester-number" className="block text-sm font-medium text-gray-700 mb-1">
                Semester Number <span className="text-red-500">*</span>
              </label>
              <input
                id="semester-number"
                type="number" // Use type="number" for better mobile UX, validation handled separately
                name="number"
                value={newSemester.number}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3..."
                required
                min="1"
                disabled={isSubmitting}
                className="appearance-none w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-60 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the numerical order of the semester.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Semester
                </>
              )}
            </button>
          </form>
        </div>

        {/* Semesters List Section */}
        <div className="space-y-5">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-7 w-7 text-indigo-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Semesters</h2>
          </div>

          {branch.semesters && branch.semesters.length === 0 ? (
            // --- Enhanced Empty State ---
            <div className="text-center py-10 px-6 bg-white rounded-xl shadow-md border border-gray-200">
              <Inbox className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-800">No Semesters Yet</h3>
              <p className="text-sm text-gray-500 mt-1">Use the form above to add the first semester to this branch.</p>
            </div>
          ) : (
            // --- Enhanced Table Styling ---
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Semester
                      </th>
                      <th scope="col" className="relative px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                         {/* <span className="sr-only">Actions</span> */}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branch.semesters
                      // Optionally sort semesters by number if backend doesn't guarantee order
                      .sort((a, b) => a.number - b.number)
                      .map(semester => (
                      <tr key={semester.id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <Link
                            to={`/branches/${branchId}/semesters/${semester.id}`}
                            className="group inline-flex items-center text-indigo-600 hover:text-indigo-800"
                          >
                            Semester {semester.number}
                            <ExternalLink className="ml-1.5 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                          {/* --- Enhanced Delete Button --- */}
                          <button
                            onClick={() => handleDelete(semester.id)}
                            disabled={isDeleting === semester.id} // Disable only the specific button being processed
                            aria-label={`Delete Semester ${semester.number}`}
                            title={`Delete Semester ${semester.number}`} // Tooltip for desktop
                            className={`p-2 rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out ${
                              isDeleting === semester.id ? 'cursor-wait' : ''
                            }`}
                          >
                            {isDeleting === semester.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                          {/* Add Edit button here if needed in the future */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchDetails;