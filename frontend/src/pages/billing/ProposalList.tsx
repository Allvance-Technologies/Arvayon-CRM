import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { FileText, Printer, Edit, Plus, Search } from 'lucide-react'

export function ProposalList() {
    const [proposals, setProposals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        api.get('/proposals')
            .then(res => setProposals(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const filtered = proposals.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Accepted': return 'bg-emerald-100 text-emerald-700'
            case 'Sent': return 'bg-blue-100 text-blue-700'
            case 'Rejected': return 'bg-red-100 text-red-700'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Proposal Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Generate and manage high-quality architectural proposals</p>
                </div>
                <Link
                    to="/proposals/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                    <Plus className="w-4 h-4" />
                    New Proposal
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search proposals..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
                            <p className="font-medium">Loading proposals...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-medium">{searchTerm ? 'No matching proposals found.' : 'No proposals generated yet.'}</p>
                            {!searchTerm && (
                                <Link to="/proposals/new" className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                                    Create your first proposal
                                </Link>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-slate-50/50">
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Reference</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Proposal Title</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Client / Project</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Status</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                PRP-{String(p.id).padStart(4, '0')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{p.title}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(p.created_at).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-700">{p.client_name || 'Individual'}</div>
                                            <div className="text-xs text-slate-500">{p.project?.name || 'Quick Draft'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${getStatusStyle(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    to={`/proposals/${p.id}/edit`}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Proposal"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    to={`/proposals/${p.id}/print`}
                                                    target="_blank"
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Print / View PDF"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
