import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const { data } = await api.get('/complaints');
                setComplaints(data);
            } catch (error) {
                console.error('Failed to fetch complaints', error);
            } finally {
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">
                    {user?.role === 'admin' ? 'Admin Dashboard' : 'My Complaints'}
                </h1>
                {user?.role === 'citizen' && (
                    <Link
                        to="/file-complaint"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        File New Complaint
                    </Link>
                )}
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {complaints.map((complaint) => (
                        <ComplaintCard key={complaint._id} complaint={complaint} />
                    ))}
                    {complaints.length === 0 && (
                        <p className="text-gray-500 col-span-full text-center">No complaints found.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
