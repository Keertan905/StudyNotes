import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  FileText,
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService, type SystemStats, type AdminUser } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(search),
      ]);
      setStats(statsData);
      setUsers(usersData.users);
    } catch {
      toast.error('Failed to load administrative data or unauthorized access.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot disable your own administrator account.');
      return;
    }
    const newStatus = !user.enabled;
    setIsUpdating(user.id);
    try {
      const updated = await adminService.updateUserStatus(user.id, newStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`User ${user.email} is now ${newStatus ? 'Active' : 'Disabled'}.`);
    } catch {
      toast.error('Failed to update user account status.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot modify your own administrator role.');
      return;
    }
    const newRole = user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
    if (!window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`)) {
      return;
    }
    setIsUpdating(user.id);
    try {
      const updated = await adminService.updateUserRole(user.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast.success(`User ${user.email} promoted to ${newRole}.`);
      fetchData();
    } catch {
      toast.error('Failed to update user role.');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4 text-emerald-400" />
            Restricted Admin Zone • Role: {currentUser?.role}
          </div>
          <h1 className="text-2xl font-bold">Platform Governance & Security</h1>
          <p className="text-slate-400 text-xs mt-1">
            Protected by Spring Security <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded font-mono text-[11px]">ROLE_ADMIN</code>, SQL injection protection, and sanitized inputs.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition shadow-lg self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Registered</span>
            <span className="text-2xl font-bold text-slate-900">{stats?.totalUsers ?? '...'}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
              {stats?.totalStudents ?? 0} Students • {stats?.totalAdmins ?? 0} Admins
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Subjects & Courses</span>
            <span className="text-2xl font-bold text-slate-900">{stats?.totalSubjects ?? '...'}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Enrolled syllabi</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Secure Documents</span>
            <span className="text-2xl font-bold text-slate-900">{stats?.totalDocuments ?? '...'}</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">Path-sanitized</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">AI Engine Status</span>
            <span className="text-base font-bold text-slate-900 uppercase">{stats?.apiProvider || 'GROQ'}</span>
            <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Masked & Protected
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Cpu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Security Health Checklist */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-400">
          <Activity className="w-4 h-4" />
          Active Security Rules & Hardening
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> API Keys & Secrets
            </div>
            <p className="text-slate-400 text-[11px]">
              Environment variable overrides (<code className="text-indigo-300">GROQ_API_KEY</code>, <code className="text-indigo-300">JWT_SECRET</code>) with <code className="text-indigo-300">application-local.properties</code> git-ignored.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Database & Error Masking
            </div>
            <p className="text-slate-400 text-[11px]">
              100% Parameterized JPA / JPQL queries. Spring Boot stack traces and SQL constraint errors are masked in API responses.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Secure File Uploads
            </div>
            <p className="text-slate-400 text-[11px]">
              Strict extension whitelist (<code className="text-indigo-300">.pdf, .txt, .md</code>), directory traversal rejection, null-byte sanitization, 20MB ceiling.
            </p>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Platform User Management</h2>
            <p className="text-xs text-slate-500">View registered accounts, toggle authorization status, or adjust roles.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Institution / Branch</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      Loading platform users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {u.name}
                          {isSelf && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'ADMIN' ? '🛡️ ADMIN' : '🎓 STUDENT'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            u.enabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.enabled ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" /> Disabled
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {u.college || u.branch ? (
                          <div>
                            <span className="font-medium">{u.college || 'College'}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {u.branch || 'Branch'} {u.semester ? `• Sem ${u.semester}` : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          disabled={isSelf || isUpdating === u.id}
                          onClick={() => handleToggleRole(u)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          title={isSelf ? 'Cannot alter own role' : 'Toggle between ADMIN and STUDENT'}
                        >
                          {u.role === 'ADMIN' ? 'Demote to Student' : 'Promote to Admin'}
                        </button>

                        <button
                          disabled={isSelf || isUpdating === u.id}
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                            u.enabled
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={isSelf ? 'Cannot disable own account' : u.enabled ? 'Disable user' : 'Re-enable user'}
                        >
                          {u.enabled ? 'Suspend' : 'Activate'}
                        </button>
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
}
