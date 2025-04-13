import { Link } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { toast, Toaster } from 'react-hot-toast'; // Still use toast for feedback before reload
import {
  PlusCircle,
  Loader2,
  Building,
  List,
  ExternalLink,
  AlertCircle,
  Trash2
} from 'lucide-react';

/**
 * Branches Component
 * Fetches and displays branches. Allows creation and deletion with full page refresh on success.
 * @param {Array} branches - Array of branch objects { id, name, description } (Passed from parent, fetched initially)
 */
function Branches({ branches = [] }) { // Removed setBranches prop
    console.log(branches)
  const [newBranch, setNewBranch] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBranch({ ...newBranch, [name]: value });
  };

  // --- Handle Branch Creation ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBranch.name) {
        toast.error('Branch Name is required.');
        return;
    }
    setIsSubmitting(true);
    // Use toast.promise for better loading/success/error handling with reload
    await toast.promise(
        axios.post('/api/branches', newBranch), // Use proxy path
        {
            loading: 'Creating branch...',
            success: (response) => {
                // We don't need the response data if we reload
                setNewBranch({ name: '', description: '' }); // Clear form before reload
                // Use setTimeout to allow toast to be seen briefly before reload
                setTimeout(() => window.location.reload(), 500); // Reload after 0.5 seconds
                return 'Branch created successfully!'; // Toast message
            },
            error: (error) => {
                console.error('Error creating branch:', error);
                setIsSubmitting(false); // Reset button state on error
                return error.response?.data?.error || 'Failed to create branch.'; // Error toast message
            },
        }
    );
    // Note: isSubmitting remains true until success/error handles it or reload happens
  };

  // --- Handle Branch Deletion ---
  const handleDelete = async (branchId, branchName) => {
    if (!window.confirm(`Are you sure you want to delete the branch "${branchName}"? This action cannot be undone.`)) {
        return;
    }
    setIsDeleting(branchId); // Set loading state for the specific button

    // Use toast.promise for better handling
    await toast.promise(
        axios.delete(`/api/branches/${branchId}`), // Use proxy path
        {
            loading: `Deleting branch "${branchName}"...`,
            success: () => {
                 // Use setTimeout to allow toast to be seen briefly before reload
                setTimeout(() => window.location.reload(), 500); // Reload after 0.5 seconds
                return `Branch "${branchName}" deleted successfully!`;
            },
            error: (error) => {
                 console.error(`Error deleting branch ${branchId}:`, error);
                 setIsDeleting(null); // Reset delete state on error
                 return error.response?.data?.error || `Failed to delete branch "${branchName}".`;
            }
        }
    );
     // Note: isDeleting remains set until success/error handles it or reload happens
  };


  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Toaster should ideally be in the parent/root component */}
        {/* <Toaster position="top-center" reverseOrder={false} /> */}

        {/* Form Section (no changes) */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
             <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Branch</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... form inputs for name and description ... */}
                <div>
                    <label htmlFor="branch-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                    id="branch-name"
                    type="text"
                    name="name"
                    value={newBranch.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting || isDeleting} // Disable form while submitting OR deleting
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                    placeholder="e.g., Computer Science"
                    />
                </div>
                <div>
                    <label htmlFor="branch-desc" className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                    </label>
                    <textarea
                        id="branch-desc"
                        name="description"
                        rows="3"
                        value={newBranch.description}
                        onChange={handleInputChange}
                        disabled={isSubmitting || isDeleting} // Disable form while submitting OR deleting
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                        placeholder="A brief description of the branch"
                    />
                </div>
                <div>
                    <button
                    type="submit"
                    disabled={isSubmitting || !!isDeleting} // Disable if submitting OR any delete is in progress
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : (
                        <><PlusCircle className="mr-2 h-4 w-4" />Create Branch</>
                    )}
                    </button>
                </div>
            </form>
        </div>

        {/* List Section (displays the 'branches' prop passed from parent) */}
         <div className="space-y-4">
            {/* ... list header ... */}
            <div className="flex items-center space-x-2">
                <List className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-800">Available Branches</h2>
            </div>

            {branches.length === 0 ? (
                 <div className="text-center py-10 px-4 bg-gray-50 rounded-md border border-gray-200">
                    <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-600 text-lg">No branches found.</p>
                    <p className="text-sm text-gray-500 mt-1">Use the form above to add the first branch.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches.map(branch => (
                        <div key={branch.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-5 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200 ease-in-out">
                           {/* Branch Info */}
                            <div className="mb-4">
                            {/* ... branch name and description ... */}
                             <h3 className="text-lg font-semibold text-gray-800 mb-1">{branch.name}</h3>
                            <p className="text-sm text-gray-600 line-clamp-3">
                                {branch.description || <span className="italic text-gray-400">No description provided.</span>}
                            </p>
                            </div>
                             {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
                                {/* View Details Button */}
                                <Link
                                    to={`/branches/${branch.id}`}
                                    className="flex-1 text-center inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                                >
                                    View Details
                                    <ExternalLink className="ml-1.5 h-4 w-4" />
                                </Link>
                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDelete(branch.id, branch.name)}
                                    disabled={isDeleting === branch.id || isSubmitting} // Disable if deleting this OR if submitting form
                                    aria-label={`Delete branch ${branch.name}`}
                                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                                >
                                    {isDeleting === branch.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                    <Trash2 className="h-4 w-4" />
                                    )}
                                    <span className="ml-2 hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}

export default Branches;
