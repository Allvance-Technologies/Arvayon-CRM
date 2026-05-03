import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export function QuoteList() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/quotes')
            .then(res => setQuotes(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Quotes</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Manage project quotes and billing calculations</p>
                </div>
                <Link
                    to="/quotes/new"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Create Quote
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="p-6 text-center text-slate-500">Loading quotes...</div>
                    ) : quotes.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No quotes found. Create a quote from a project.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Quote #</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Project</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                                    <th className="px-5 py-3 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {quotes.map((q: any) => (
                                    <tr key={q.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-5 py-4 font-semibold text-gray-800">#{q.quote_number}</td>
                                        <td className="px-5 py-4 text-gray-600">{q.project?.name || 'Unknown'}</td>
                                        <td className="px-5 py-4 font-semibold text-gray-800">₹{Number(q.total_amount).toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${q.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                                                q.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Link to={`/quotes/${q.id}/edit`} className="text-blue-600 hover:underline font-medium text-xs">Edit</Link>
                                                <Link to={`/quotes/${q.id}/print`} target="_blank" className="text-yellow-600 hover:underline font-medium text-xs">Print A4</Link>
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
