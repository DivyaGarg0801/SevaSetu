import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ComplaintCard = ({ complaint, onStatusUpdate }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState(complaint.status);
    const [loading, setLoading] = useState(false);

    const handleStatusChange = async (newStatus) => {
        setLoading(true);
        try {
            const { data } = await api.put(`/complaints/${complaint._id}/status`, { status: newStatus });
            setStatus(data.status);
            if (onStatusUpdate) onStatusUpdate(data);
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">{complaint.category}</h3>
                    <p className="mt-1 text-sm text-gray-500">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                    {status}
                </span>
            </div>
            <p className="mt-4 text-gray-700">{complaint.description}</p>
            {complaint.image && (
                <img
                    src={`http://localhost:5001/${complaint.image}`}
                    alt="Complaint"
                    className="mt-4 h-48 w-full object-cover rounded-md"
                />
            )}
            {complaint.location && (
                <div className="mt-2 text-sm text-gray-500">
                    Location: {complaint.location.latitude}, {complaint.location.longitude}
                    {/* Map link or embedded map could go here */}
                </div>
            )}

            {user.role === 'admin' && (
                <div className="mt-4 flex space-x-2">
                    <button
                        onClick={() => handleStatusChange('Pending')}
                        disabled={loading || status === 'Pending'}
                        className={`px-3 py-1 rounded text-sm ${status === 'Pending' ? 'bg-gray-300' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => handleStatusChange('In Progress')}
                        disabled={loading || status === 'In Progress'}
                        className={`px-3 py-1 rounded text-sm ${status === 'In Progress' ? 'bg-gray-300' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                    >
                        In Progress
                    </button>
                    <button
                        onClick={() => handleStatusChange('Resolved')}
                        disabled={loading || status === 'Resolved'}
                        className={`px-3 py-1 rounded text-sm ${status === 'Resolved' ? 'bg-gray-300' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                        Resolved
                    </button>
                </div>
            )}
        </div>
    );
};

export default ComplaintCard;
