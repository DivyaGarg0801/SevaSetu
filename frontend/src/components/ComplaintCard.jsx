import { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ComplaintCard = ({ complaint, onStatusUpdate }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState(complaint.status);
    const [loading, setLoading] = useState(false);
    const [remark, setRemark] = useState(complaint.remark || '');
    const [pendingRejection, setPendingRejection] = useState(false);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'Rejected' && !remark) {
            setPendingRejection(true);
            return;
        }

        setLoading(true);
        try {
            const payload = { status: newStatus };
            if (newStatus === 'Rejected') {
                payload.remark = remark;
            }

            const { data } = await api.put(`/complaints/${complaint._id}/status`, payload);
            setStatus(data.status);
            setRemark(data.remark || '');
            setPendingRejection(false);
            if (onStatusUpdate) onStatusUpdate(data);
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-6 mb-4">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">{complaint.category}</h3>
                    <p className="mt-1 text-sm text-gray-500">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                    {complaint.department && <p className="text-sm text-gray-500">Department: {complaint.department}</p>}
                    {complaint.user && (
                        <p className="text-sm text-gray-500">Submitted by: {complaint.user.name} ({complaint.user.email})</p>
                    )}
                    {complaint.assignedTo ? (
                        <p className="mt-1 text-sm text-gray-500">
                            Assigned to: {complaint.assignedTo.name} ({complaint.assignedTo.department})
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-gray-500">Assigned to: waiting for department admin</p>
                    )}
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${status === 'Resolved' ? 'bg-green-100 text-green-800' :
                        status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
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
                </div>
            )}
            {complaint.remark && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                    <span className="font-medium">Admin remark:</span> {complaint.remark}
                </div>
            )}

            {user.role === 'admin' && (
                <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
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
                        <button
                            onClick={() => handleStatusChange('Rejected')}
                            disabled={loading || status === 'Rejected'}
                            className={`px-3 py-1 rounded text-sm ${status === 'Rejected' ? 'bg-gray-300' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        >
                            Rejected
                        </button>
                    </div>
                    {pendingRejection && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Rejection remark</label>
                            <textarea
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                            />
                            <button
                                onClick={() => handleStatusChange('Rejected')}
                                disabled={loading || !remark}
                                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                                Submit Rejection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ComplaintCard;
