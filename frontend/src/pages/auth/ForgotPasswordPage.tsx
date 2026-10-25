import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mail, ArrowLeft, ArrowRight, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { authService } from "../../services/auth.service";
import toast from "react-hot-toast";

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
      toast.success("Reset link sent! Please check your email inbox.");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to process request. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8f7fd]">
      {/* Left Column: Full-bleed Hero Section matching reference image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-screen bg-gradient-to-b from-[#5641e6] via-[#6543ea] to-[#eae5fe] relative overflow-hidden select-none items-center justify-center">
        <img
          src="/assets/images/forgot-hero-perfect.png"
          alt="StudyApp - Reset Your Password"
          className="w-full h-full max-h-screen object-contain object-center"
        />
      </div>

      {/* Right Column: Clean Floating Forgot Password Card */}
      <div className="w-full lg:w-1/2 xl:w-[48%] min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f8f7fd]">
        <div className="w-full max-w-[410px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(89,61,238,0.08)] border border-slate-100 transition-all my-auto">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#593dee] hover:opacity-90 transition-opacity mb-2"
            >
              <BookOpen className="w-7 h-7 stroke-[2.4]" />
              <span className="text-xl font-bold text-slate-900 tracking-tight">StudyApp</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Forgot Password?
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5 max-w-xs mx-auto">
              Enter your email address and we'll send you a reset link.
            </p>
          </div>

          {/* Success State */}
          {isSubmitted ? (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Reset link sent!</h2>
                <p className="text-xs text-slate-500 mt-1">
                  We've sent a password recovery link to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 bg-[#593dee] hover:bg-[#4b2fd9] text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2]" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>{error}</span>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4 stroke-[1.8]" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="keertanraghuwanshi@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#593dee] hover:bg-[#4b2fd9] active:scale-[0.99] disabled:opacity-70
                  text-white font-semibold rounded-xl transition-all shadow-md shadow-[#593dee]/25 hover:shadow-lg hover:shadow-[#593dee]/35
                  flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 stroke-[2]" />
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">or</span>
                </div>
              </div>

              {/* Back to Sign In */}
              <Link
                to="/login"
                className="w-full py-2 px-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-4 h-4 stroke-[1.8]" />
                <span>Back to Sign In</span>
              </Link>
            </form>
          )}

          {/* Privacy Note */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-400 text-xs">
            <Lock className="w-3.5 h-3.5 stroke-[1.8]" />
            <span>We'll never share your email with anyone.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
