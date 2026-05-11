import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import { Dashboard } from './pages/dashboard/Dashboard'
import { LeadList } from './pages/leads/LeadList'
import { LeadDetail } from './pages/leads/LeadDetail'
import LeadForm from './pages/leads/LeadForm'
import { ProjectList } from './pages/projects/ProjectList'
import { ProjectDetail } from './pages/projects/ProjectDetail'
import ProjectForm from './pages/projects/ProjectForm'
import { TaskList } from './pages/tasks/TaskList'
import TaskForm from './pages/tasks/TaskForm'
import { InvoiceList } from './pages/invoices/InvoiceList'
import InvoiceForm from './pages/invoices/InvoiceForm'
import PaymentForm from './pages/invoices/PaymentForm'
import { FinancialReports } from './pages/reports/FinancialReports'
import { AIProjectManager } from './pages/reports/AIProjectManager'
import { SearchResults } from './pages/search/SearchResults'
import { UserList } from './pages/users/UserList'
import UserForm from './pages/users/UserForm'
import { QuoteList } from './pages/billing/QuoteList'
import QuoteForm from './pages/billing/QuoteForm'
import QuotePrint from './pages/billing/QuotePrint'
import { ProposalList } from './pages/billing/ProposalList'
import ProposalForm from './pages/billing/ProposalForm'
import ProposalPrint from './pages/billing/ProposalPrint'
import { EmployeeList } from './pages/employees/EmployeeList'
import EmployeeForm from './pages/employees/EmployeeForm'
import { EmployeeDetail } from './pages/employees/EmployeeDetail'
import { PayrollList } from './pages/payroll/PayrollList'
import { AttendanceList } from './pages/attendance/AttendanceList'
// Guard: redirect unauthenticated users to /login
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes — all wrapped in Layout */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path="leads" element={<LeadList />} />
        <Route path="leads/new" element={<LeadForm />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="leads/:id/edit" element={<LeadForm />} />

        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/edit" element={<ProjectForm />} />

        <Route path="tasks" element={<TaskList />} />
        <Route path="tasks/new" element={<TaskForm />} />
        <Route path="tasks/:id/edit" element={<TaskForm />} />

        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="invoices/:invoiceId/payments/new" element={<PaymentForm />} />
        <Route path="payments/:id/edit" element={<PaymentForm />} />

        <Route path="quotes" element={<QuoteList />} />
        <Route path="quotes/new" element={<QuoteForm />} />
        <Route path="quotes/:id/edit" element={<QuoteForm />} />

        <Route path="proposals" element={<ProposalList />} />
        <Route path="proposals/new" element={<ProposalForm />} />
        <Route path="proposals/:id/edit" element={<ProposalForm />} />

        <Route path="reports" element={<FinancialReports />} />
        <Route path="reports/ai-manager" element={<AIProjectManager />} />
        <Route path="search" element={<SearchResults />} />

        <Route path="users" element={<UserList />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:id/edit" element={<UserForm />} />

        <Route path="employees" element={<EmployeeList />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />

        <Route path="payroll" element={<PayrollList />} />
        <Route path="attendance" element={<AttendanceList />} />
      </Route>

      {/* Isolation for high-fidelity printing (No CRM Sidebar/Header) */}
      <Route path="/quotes/:id/print" element={<QuotePrint />} />
      <Route path="/proposals/:id/print" element={<ProposalPrint />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
