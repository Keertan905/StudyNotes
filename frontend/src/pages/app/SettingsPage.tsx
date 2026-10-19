import { useState, useEffect, useId } from "react";
import { 
  User, 
  Shield, 
  Key, 
  Save, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Download, 
  Trash2, 
  LogOut,
  Brain,
  Sliders,
  BellRing
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { userService } from "../../services/user.service";
import toast from "react-hot-toast";

type ActiveTab = "profile" | "ai" | "security";

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // Profile State
  const [name, setName] = useState(user?.name || "");
  const [college, setCollege] = useState(user?.college || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [semester, setSemester] = useState<number | "">(user?.semester || 1);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // AI Preferences State (stored in localStorage)
  const [explanationStyle, setExplanationStyle] = useState(() => {
    return localStorage.getItem("study_pref_explanation_style") || "Socratic & Step-by-Step";
  });
  const [studyGoal, setStudyGoal] = useState(() => {
    return localStorage.getItem("study_pref_goal") || "Distinction (85%+)";
  });
  const [sm2Rigour, setSm2Rigour] = useState(() => {
    return localStorage.getItem("study_pref_sm2_rigour") || "Balanced";
  });
  const [enableSound, setEnableSound] = useState(() => {
    return localStorage.getItem("study_pref_sound") !== "false";
  });

  const nameInputId = useId();
  const collegeInputId = useId();
  const branchInputId = useId();
  const semesterInputId = useId();
  const currPwdId = useId();
  const newPwdId = useId();
  const confirmPwdId = useId();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCollege(user.college || "");
      setBranch(user.branch || "");
      setSemester(user.semester || 1);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await userService.updateProfile({
        name: name.trim(),
        college: college.trim() || undefined,
        branch: branch.trim() || undefined,
        semester: semester ? Number(semester) : undefined,
      });

      if (user) {
        updateUser({
          ...user,
          name: updated.name,
          college: updated.college,
          branch: updated.branch,
          semester: updated.semester,
        });
      }
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      const res = await userService.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(res.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to change password";
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveAiPreferences = () => {
    localStorage.setItem("study_pref_explanation_style", explanationStyle);
    localStorage.setItem("study_pref_goal", studyGoal);
    localStorage.setItem("study_pref_sm2_rigour", sm2Rigour);
    localStorage.setItem("study_pref_sound", String(enableSound));
    toast.success("AI and Study preferences saved!");
  };

  const handleExportData = () => {
    const exportObject = {
      profile: user,
      preferences: {
        explanationStyle,
        studyGoal,
        sm2Rigour,
        enableSound,
      },
      exportDate: new Date().toISOString(),
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `studyapp_profile_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Student profile exported successfully!");
  };

  const handleClearCache = () => {
    if (confirm("Clear local study cache and reload? Your account and server notes remain safe.")) {
      localStorage.removeItem("study_pref_explanation_style");
      localStorage.removeItem("study_pref_goal");
      localStorage.removeItem("study_pref_sm2_rigour");
      toast.success("Local cache cleared");
      setTimeout(() => window.location.reload(), 400);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          <Sliders className="w-4 h-4" />
          <span>Account & Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your student credentials, academic focus details, and customize your AI study assistant.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "profile"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <User className="w-4 h-4" />
          Academic Profile
        </button>

        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ai"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Brain className="w-4 h-4" />
          AI & Learning Style
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "security"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security & Privacy
        </button>
      </div>

      {/* Tab 1: Academic Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your university, degree branch, and semester help personalize exam questions and syllabus recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor={nameInputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={nameInputId}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    Read-only
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor={collegeInputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  College / University
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={collegeInputId}
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    placeholder="e.g. Stanford University or MIT"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={branchInputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Degree / Major / Branch
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={branchInputId}
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={semesterInputId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Current Semester
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    id={semesterInputId}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : "")}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Account Role
                </label>
                <div className="py-2.5 px-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-semibold text-indigo-700 flex items-center justify-between">
                  <span>Student Access Tier</span>
                  <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                    PRO
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: AI & Learning Style */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Tutor Pedagogy & Persona</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tune how your RAG-grounded AI Tutor responds to your questions and structures notes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "Socratic & Step-by-Step",
                  title: "Socratic & Step-by-Step",
                  desc: "Guides you through problems with probing questions and logical derivations. Great for deep understanding.",
                },
                {
                  id: "Concise & Bullet Points",
                  title: "Concise & Bullet Points",
                  desc: "Direct, high-yield answers focused on speed and exam revision summaries without fluff.",
                },
                {
                  id: "ELI5 / Intuitive Analogies",
                  title: "Intuitive Analogies",
                  desc: "Explains difficult computer science and engineering concepts using relatable real-world metaphors.",
                },
                {
                  id: "Rigorous & Exam-Oriented",
                  title: "Exam & Formula Oriented",
                  desc: "Emphasizes exact textbook definitions, theorem proofs, and university scoring schemes.",
                },
              ].map((style) => (
                <div
                  key={style.id}
                  onClick={() => setExplanationStyle(style.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    explanationStyle === style.id
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{style.title}</h3>
                    {explanationStyle === style.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{style.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Target Academic Benchmark</h3>
                <p className="text-xs text-slate-500">Sets difficulty calibration for AI-generated practice tests and quiz questions.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {["Top 5% University Rank", "Distinction (85%+)", "Pass with Credit (65%+)"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setStudyGoal(g)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      studyGoal === g
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Spaced Repetition (SM-2) Pacing</h3>
                <p className="text-xs text-slate-500">Controls how aggressively flashcard intervals expand after successful recall.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {["Conservative (More Frequent Reps)", "Balanced", "Accelerated (Longer Intervals)"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSm2Rigour(r)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      sm2Rigour === r
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Study Session Chimes & Sound Effects</h4>
                  <p className="text-[11px] text-slate-500">Play pleasant bell sounds when focus intervals complete.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSound}
                onChange={(e) => setEnableSound(e.target.checked)}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAiPreferences}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-xs"
              >
                <Save className="w-4 h-4" />
                Save AI Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Privacy */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <form onSubmit={handlePasswordSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure your account is protected with a secure password of at least 6 characters.
              </p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div>
                <label htmlFor={currPwdId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={currPwdId}
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor={newPwdId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={newPwdId}
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor={confirmPwdId} className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id={confirmPwdId}
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
                    placeholder="Re-type new password"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
              >
                <Key className="w-4 h-4" />
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>

          {/* Session & Data Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Session & Data Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Download your account data, manage browser storage, or end your session.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Export Student Data</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Download a full JSON package of your profile and study preferences.
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Clear Local Caches</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Reset offline preferences and prompt caches without losing server study notes.
                  </p>
                </div>
                <button
                  onClick={handleClearCache}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge Cache
                </button>
              </div>

              <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-rose-800">Log Out Session</h3>
                  <p className="text-[11px] text-rose-600/80 mt-1 leading-relaxed">
                    Safely revoke your active JWT bearer token on this workstation.
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
