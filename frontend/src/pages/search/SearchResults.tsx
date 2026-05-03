import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { searchService } from '../../services/searchService';
import { User, Briefcase, CheckSquare, FileText } from 'lucide-react';

interface SearchResultGroup {
    leads?: any[];
    projects?: any[];
    tasks?: any[];
    invoices?: any[];
}

export const SearchResults: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();
    const [results, setResults] = useState<SearchResultGroup>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            fetchResults(query);
        }
    }, [query]);

    const fetchResults = async (q: string) => {
        setLoading(true);
        try {
            const response = await searchService.search(q);
            setResults(response.data || {});
        } catch (error) {
            console.error('Search failed', error);
        }
        setLoading(false);
    };

    const totalResults =
        (results.leads?.length || 0) +
        (results.projects?.length || 0) +
        (results.tasks?.length || 0) +
        (results.invoices?.length || 0);

    if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
                <p className="text-gray-500 mt-1">
                    {totalResults} results for &ldquo;<strong>{query}</strong>&rdquo;
                </p>
            </div>

            {!query && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500">Enter a search term to find leads, projects, tasks, and invoices.</p>
                </Card>
            )}

            {/* Leads */}
            {results.leads && results.leads.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <User className="w-5 h-5 text-blue-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Leads ({results.leads.length})</h2>
                    </div>
                    <div className="divide-y">
                        {results.leads.map((lead: any) => (
                            <div
                                key={lead.id}
                                className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                                onClick={() => navigate(`/leads/${lead.id}`)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{lead.name}</p>
                                    <p className="text-sm text-gray-500">{lead.email}</p>
                                </div>
                                <Badge variant={lead.status === 'Won' ? 'success' : lead.status === 'Lost' ? 'danger' : 'info'}>
                                    {lead.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Projects */}
            {results.projects && results.projects.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <Briefcase className="w-5 h-5 text-purple-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Projects ({results.projects.length})</h2>
                    </div>
                    <div className="divide-y">
                        {results.projects.map((project: any) => (
                            <div
                                key={project.id}
                                className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{project.name}</p>
                                    <p className="text-sm text-gray-500">{project.client?.name || 'No client'}</p>
                                </div>
                                <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'info' : 'default'}>
                                    {project.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Tasks */}
            {results.tasks && results.tasks.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <CheckSquare className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Tasks ({results.tasks.length})</h2>
                    </div>
                    <div className="divide-y">
                        {results.tasks.map((task: any) => (
                            <div
                                key={task.id}
                                className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                                onClick={() => navigate(`/tasks/${task.id}/edit`)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900">{task.title}</p>
                                    <p className="text-sm text-gray-500">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</p>
                                </div>
                                <Badge variant={task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'default'}>
                                    {task.priority}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Invoices */}
            {results.invoices && results.invoices.length > 0 && (
                <Card className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <FileText className="w-5 h-5 text-yellow-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Invoices ({results.invoices.length})</h2>
                    </div>
                    <div className="divide-y">
                        {results.invoices.map((invoice: any) => (
                            <div
                                key={invoice.id}
                                className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded transition-colors"
                                onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                            >
                                <div>
                                    <p className="font-medium text-gray-900">INV-{String(invoice.id).padStart(4, '0')}</p>
                                    <p className="text-sm text-gray-500">${parseFloat(invoice.total_amount).toFixed(2)}</p>
                                </div>
                                <Badge variant={invoice.status === 'Paid' ? 'success' : invoice.status === 'Overdue' ? 'danger' : 'warning'}>
                                    {invoice.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {query && totalResults === 0 && !loading && (
                <Card className="p-8 text-center">
                    <p className="text-gray-500">No results found for &ldquo;<strong>{query}</strong>&rdquo;.</p>
                    <p className="text-sm text-gray-400 mt-2">Try different keywords or check your spelling.</p>
                </Card>
            )}
        </div>
    );
};
