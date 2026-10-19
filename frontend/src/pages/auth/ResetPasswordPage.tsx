import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Loader2, CheckCircle2, XCircle, KeyRound } from "lucide-react";
import { authService } from "../../services/auth.service";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!token.trim()) e.token = "Reset token is required";

    if (!newPassword) {
      e.newPassword = "New password is required";
    } else if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
      e.newPassword = "Password must be 8+ chars and contain uppercase, lowercase, and a number";
    }

    if (!confirmPassword) {
      e.confirmPassword = "Confirm password is required";
    } else if (newPassword !== confirmPassword) {
      e.confirmPassword = "Passwords do not match";
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
      await authService.resetPassword({
        token: token.trim(),
        newPassword,
        confirmPassword,
      });

      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid or expired reset token.";
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
            <BookOpen className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">StudyApp</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Set new password</h1>
          <p className="text-slate-500 mt-1 text-sm">Please choose a strong, secure password</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {errors.form && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token (pre-filled if in query param, or manual input) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reset Token
              </label>
              <div className="relative">
                <input
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={`w-full px-3.5 py-2 pl-9 rounded-lg border text-sm outline-none transition-colors
                    ${errors.token ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                  placeholder="Paste your reset token here"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              {errors.token && <p className="mt-1 text-xs text-red-600">{errors.token}</p>}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm outline-none transition-colors
                    ${errors.newPassword ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3.5 py-2 pr-10 rounded-lg border text-sm outline-none transition-colors
                    ${errors.confirmPassword ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                  placeholder="Repeat your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <button
              id="reset-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Remember your credentials?{" "}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
