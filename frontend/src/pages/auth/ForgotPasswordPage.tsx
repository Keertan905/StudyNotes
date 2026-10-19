import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "../../services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.forgotPassword({ email: email.trim() });
      setIsSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to process request. Please try again.";
      setError(msg);
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
          <h1 className="mt-4 text-2xl font-bold text-slate-800">Forgot password?</h1>
          <p className="text-slate-500 mt-1 text-sm">No worries, we will help you reset it</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Check your email</h2>
              <p className="text-sm text-slate-600 mb-6">
                If an account exists with <span className="font-semibold text-slate-800">{email}</span>,
                you will receive password reset instructions.
              </p>
              <div className="space-y-3">
                <Link
                  to="/reset-password"
                  className="block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm text-center transition-colors"
                >
                  I have a reset token
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 pl-10 rounded-lg border text-sm outline-none transition-colors
                      ${error ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"}`}
                    placeholder="you@example.com"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                  text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
