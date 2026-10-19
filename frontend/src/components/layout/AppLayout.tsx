import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import { 
  BookOpen, 
  LayoutDashboard, 
  GraduationCap, 
  FileText, 
  Bot, 
  HelpCircle, 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  Calendar, 
  BarChart3, 
  Clock, 
  History, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
  CheckCircle2,
  CalendarCheck,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  Video
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notification.service";
import type { StudentNotification } from "../../services/notification.service";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subjects", label: "My Subjects", icon: GraduationCap },
  { to: "/notes", label: "AI Notes", icon: FileText },
  { to: "/tutor", label: "AI Tutor", icon: Bot },
  { to: "/youtube-finder", label: "Video Learning", icon: Video },
  { to: "/quiz", label: "Quiz & Exams", icon: HelpCircle },
  { to: "/flashcards", label: "Flashcards", icon: Sparkles },
  { to: "/knowledge-gaps", label: "Knowledge Gaps", icon: BrainCircuit },
  { to: "/mistakes", label: "Mistake Intelligence", icon: AlertTriangle },
  { to: "/planner", label: "Study Planner", icon: Calendar },
  { to: "/analytics", label: "Readiness Analytics", icon: BarChart3 },
  { to: "/timer", label: "Study Timer", icon: Clock },
  { to: "/history", label: "Study History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("studyapp_sidebar_collapsed") === "true";
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("studyapp_sidebar_collapsed", String(next));
      return next;
    });
  };

  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const count = data.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      // Ignore background error
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = async (notif: StudentNotification) => {
    try {
      if (!notif.isRead) {
        await notificationService.markAsRead(notif.id);
        setNotifications(notifications.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
      setNotificationsOpen(false);
      if (notif.link) {
        navigate(notif.link);
      }
    } catch {
      // Navigate anyway
      if (notif.link) navigate(notif.link);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Determine current page title for breadcrumb
  const currentNavItem = navItems.find(item => item.to === location.pathname);
  const currentPageTitle = currentNavItem ? currentNavItem.label : "Workspace";

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Persistent Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-slate-200 
        flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? "lg:w-20 w-64" : "w-64"}
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-slate-200 transition-all duration-300 ${
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-5"
        }`}>
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0" title="StudyApp">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-extrabold tracking-tight text-slate-900 truncate animate-in fade-in duration-200">
                StudyApp
              </span>
            )}
          </Link>

          <div className="flex items-center gap-1">
            {/* Desktop Minimize/Expand Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition-all ${
                    sidebarCollapsed ? "justify-center px-2.5 py-2.5" : "gap-3 px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout in Sidebar Footer */}
        <div className={`p-3 border-t border-slate-200 bg-slate-50/60 transition-all ${
          sidebarCollapsed ? "flex flex-col items-center gap-2" : ""
        }`}>
          {sidebarCollapsed ? (
            <>
              <div 
                className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm"
                title={`${user?.name || "Student"} (${user?.email})`}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="w-9 h-9 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/60"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || "Student"}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200/60"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header / Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Quick Toggle Button in Header */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors font-medium">
                StudyApp
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900">{currentPageTitle}</span>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-indigo-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <p className="text-xs">No notifications right now</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const iconData = (() => {
                          switch (n.type) {
                            case "EXAM_REMINDER":
                              return { icon: CalendarCheck, color: "bg-rose-100 text-rose-600" };
                            case "FLASHCARD_REVIEW":
                              return { icon: Sparkles, color: "bg-amber-100 text-amber-600" };
                            case "ACHIEVEMENT":
                              return { icon: Flame, color: "bg-emerald-100 text-emerald-600" };
                            default:
                              return { icon: Bell, color: "bg-indigo-100 text-indigo-600" };
                          }
                        })();
                        const NIcon = iconData.icon;

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all hover:shadow-xs ${
                              !n.isRead ? "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50" : "bg-white border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconData.color}`}>
                              <NIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.timeAgo}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || "Student"}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">Semester {user?.semester || 1}</p>
                </div>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" />
                      Role: {user?.role || "STUDENT"}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/onboarding"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Update Study Preferences
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      Platform Settings
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
