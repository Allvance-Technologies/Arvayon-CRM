import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    Admin: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    Manager: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    Sales: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Architect: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    Accounts: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ef4444', '#06b6d4', '#f59e0b', '#ec4899'];


export const UserList: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user?.role !== 'Admin') { navigate('/'); return; }
        fetchUsers();
    }, [user]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const r = await api.get('/users');
            setUsers(r.data.data || r.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const roleCounts = users.reduce((acc: Record<string, number>, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1; return acc;
    }, {});

    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">User Management</h1>
                    <p className="text-xs text-gray-500 mt-0.5">{users.length} team members</p>
                </div>
                <button
                    onClick={() => navigate('/users/new')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                    Add User
                </button>
            </div>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(ROLE_STYLES).map(([role, style]) => (
                    <div key={role} className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
                        <p className={`text-2xl font-bold ${style.text}`}>{roleCounts[role] || 0}</p>
                        <p className={`text-xs font-semibold ${style.text} opacity-70 mt-0.5`}>{role}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search users by name, email, or role…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    />
                </div>
            </div>

            {/* User Cards / Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">User</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Last Login</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-sm text-gray-400">No users found</td>
                                </tr>
                            ) : (
                                filtered.map((u: any, i: number) => {
                                    const rs = ROLE_STYLES[u.role] || ROLE_STYLES['Sales'];
                                    const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                                    return (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/users/${u.id}/edit`)}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                        style={{ background: avatarColor }}
                                                    >
                                                        {u.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{u.name}</p>
                                                        <p className="text-[10px] text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rs.bg} ${rs.text} ${rs.border}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600">
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-500">
                                                {u.last_login ? new Date(u.last_login).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                                            </td>
                                            <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex gap-3">
                                                    <button onClick={e => { e.stopPropagation(); navigate(`/users/${u.id}/edit`); }} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                                                    {u.id !== user?.id && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Remove ${u.name}?`)) {
                                                                    api.delete(`/users/${u.id}`).then(() => fetchUsers()).catch(() => { });
                                                                }
                                                            }}
                                                            className="text-xs text-red-500 font-semibold hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
