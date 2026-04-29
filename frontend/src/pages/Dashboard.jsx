import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ComplaintCard from '../components/ComplaintCard';
import { Link } from 'react-router-dom';

const statusOptions = ['', 'Pending', 'In Progress', 'Resolved', 'Rejected'];
const departmentOptions = ['', 'Roads', 'Water', 'Electricity', 'Sanitation'];

const Dashboard = () => {
    const [complaints, setComplaints] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('Roads');
    const [statusFilter, setStatusFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [adminActionLoading, setAdminActionLoading] = useState(false);
    const [adminError, setAdminError] = useState('');
    const [adminSuccess, setAdminSuccess] = useState('');

    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setFilterLoading(true);

        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (user.role === 'superadmin' && departmentFilter) params.department = departmentFilter;

            const requests = [api.get('/complaints', { params })];
            if (user.role === 'superadmin') {
                requests.push(api.get('/analytics'));
                requests.push(api.get('/admins'));
            }

            const [complaintRes, analyticsRes, adminRes] = await Promise.all(requests);
            setComplaints(complaintRes.data);
            setAnalytics(analyticsRes?.data || null);
            setAdmins(adminRes?.data || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
            setFilterLoading(false);
        }
    }, [user, statusFilter, departmentFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setAdminActionLoading(true);
        setAdminError('');
        setAdminSuccess('');

        try {
            const { data } = await api.post('/admins', { name, email, password, department });
            setAdmins((prev) => [...prev, data]);
            setName('');
            setEmail('');
            setPassword('');
            setAdminSuccess('Admin created successfully');
        } catch (error) {
            setAdminError(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setAdminActionLoading(false);
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        setAdminActionLoading(true);
        setAdminError('');
        setAdminSuccess('');

        try {
            await api.delete(`/admins/${adminId}`);
            setAdmins((prev) => prev.filter((admin) => admin._id !== adminId));
            setAdminSuccess('Admin deleted successfully');
        } catch (error) {
            setAdminError(error.response?.data?.message || 'Failed to delete admin');
        } finally {
            setAdminActionLoading(false);
        }
    };

    const resetFilters = () => {
        setStatusFilter('');
        setDepartmentFilter('');
    };

    const pageTitle =
        user?.role === 'superadmin'
            ? 'Super Admin Dashboard'
            : user?.role === 'admin'
            ? `${user.department} Department Dashboard`
            : 'My Complaints';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
                    {user?.role === 'admin' && (
                        <p className="text-sm text-gray-500">You can manage complaints for the {user.department} department only.</p>
                    )}
                    {user?.role === 'citizen' && (
                        <p className="text-sm text-gray-500">Submit new complaints and track your own requests.</p>
                    )}
                </div>
                {user?.role === 'citizen' && (
                    <Link
                        to="/file-complaint"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        File New Complaint
                    </Link>
                )}
            </div>

            <div className="bg-white shadow rounded-lg p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Filter by status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status || 'All statuses'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {user?.role === 'superadmin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Filter by department</label>
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {departmentOptions.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept || 'All departments'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={resetFilters}
                            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Reset filters
                        </button>
                        <span className="text-sm text-gray-500">{filterLoading ? 'Applying filters...' : `${complaints.length} complaints`}</span>
                    </div>
                </div>
            </div>

            {user?.role === 'superadmin' && (
                <div className="mb-10 grid gap-6 xl:grid-cols-3">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Overall Summary</h2>
                        {analytics ? (
                            <div className="space-y-4 text-sm text-gray-700">
                                <div className="space-y-2">
                                    <p className="font-medium">Total complaints</p>
                                    <p className="text-3xl text-blue-700">{analytics.totalComplaints}</p>
                                </div>
                                <div>
                                    <p className="font-medium mb-2">Status breakdown</p>
                                    {statusOptions.slice(1).map((status) => {
                                        const count = analytics.statusCounts?.[status] || 0;
                                        const percent = analytics.totalComplaints ? (count / analytics.totalComplaints) * 100 : 0;
                                        return (
                                            <div key={status} className="mb-2">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>{status}</span>
                                                    <span>{count}</span>
                                                </div>
                                                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-600" style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div>Loading analytics...</div>
                        )}
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 xl:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Department performance</h2>
                        {analytics ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {departmentOptions.slice(1).map((dept) => (
                                    <div key={dept} className="rounded-lg border border-gray-100 p-4">
                                        <p className="font-medium text-gray-700 mb-2">{dept}</p>
                                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${analytics.totalComplaints ? ((analytics.departmentCounts?.[dept] || 0) / analytics.totalComplaints) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500">{analytics.departmentCounts?.[dept] || 0} complaints</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>Loading department stats...</div>
                        )}
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 xl:col-span-3">
                        <h2 className="text-xl font-semibold mb-4">Assigned workload</h2>
                        {analytics?.assignedCounts?.length ? (
                            <div className="space-y-3">
                                {analytics.assignedCounts.map((item) => (
                                    <div key={`${item.email}-${item.department}`} className="rounded-lg border border-gray-100 p-4">
                                        <div className="flex justify-between items-center gap-3 mb-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.adminName}</p>
                                                <p className="text-sm text-gray-500">{item.email} • {item.department}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-blue-700">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No assigned complaints yet.</p>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {complaints.map((complaint) => (
                        <ComplaintCard key={complaint._id} complaint={complaint} onStatusUpdate={(updated) => {
                            setComplaints((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
                        }} />
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
