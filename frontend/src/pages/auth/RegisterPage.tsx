import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    branch: "",
    semester: "" as string | number,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password rules validation
  const hasMinLength = form.password.length >= 8;
  const hasUpper = /[A-Z]/.test(form.password);
  const hasLower = /[a-z]/.test(form.password);
  const hasNumber = /\d/.test(form.password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) e.email = "Enter a valid email address";

    if (!form.password) e.password = "Password is required";
    else if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
      e.password = "Password must be 8+ chars and contain uppercase, lowercase, and a number";
    }

    if (!form.confirmPassword) e.confirmPassword = "Confirm password is required";
    else if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    if (form.semester) {
      const semNum = Number(form.semester);
      if (isNaN(semNum) || semNum < 1 || semNum > 12) {
        e.semester = "Semester must be between 1 and 12";
      }
    }

    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        college: form.college.trim() || undefined,
        branch: form.branch.trim() || undefined,
        semester: form.semester ? Number(form.semester) : undefined,
      };

      const res = await authService.register(payload);
      login(res.user, res.token);
      toast.success(`Account created! Welcome, ${res.user.name}`);
      navigate("/onboarding");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed. Please check your inputs.";
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
            <BookOpen className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">StudyApp</span>
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Create your student account</h1>
          <p className="text-slate-500 mt-1 text-sm">Join the AI-powered learning and study platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {errors.form && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none transition-colors
                  ${errors.name ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                placeholder="Jane Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`w-full px-3.5 py-2 rounded-lg border text-sm outline-none transition-colors
                  ${errors.email ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                placeholder="jane@university.edu"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Academic Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">College / University</label>
                <input
                  id="register-college"
                  type="text"
                  value={form.college}
                  onChange={e => setForm({ ...form, college: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. Stanford"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Branch / Major</label>
                <input
                  id="register-branch"
                  type="text"
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. CS / IT"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Semester</label>
                <input
                  id="register-semester"
                  type="number"
                  min="1"
                  max="12"
                  value={form.semester}
                  onChange={e => setForm({ ...form, semester: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none
                    ${errors.semester ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                  placeholder="1 - 12"
                />
                {errors.semester && <p className="mt-1 text-xs text-red-600">{errors.semester}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm outline-none transition-colors
                    ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicators */}
              <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
                <span className={`inline-flex items-center gap-1 ${hasMinLength ? "text-emerald-600" : "text-slate-400"}`}>
                  {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  8+ characters
                </span>
                <span className={`inline-flex items-center gap-1 ${hasUpper ? "text-emerald-600" : "text-slate-400"}`}>
                  {hasUpper ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  Uppercase letter
                </span>
                <span className={`inline-flex items-center gap-1 ${hasLower ? "text-emerald-600" : "text-slate-400"}`}>
                  {hasLower ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  Lowercase letter
                </span>
                <span className={`inline-flex items-center gap-1 ${hasNumber ? "text-emerald-600" : "text-slate-400"}`}>
                  {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  At least one digit
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm outline-none transition-colors
                    ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
