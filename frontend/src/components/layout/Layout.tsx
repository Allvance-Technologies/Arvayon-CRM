import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { ToastContainer } from '../common/Toast'
import { useToastStore } from '../../stores/toastStore'

export default function Layout() {
  const { toasts, removeToast } = useToastStore()
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--crm-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 page-enter print:p-0 print:m-0 print:bg-white">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
