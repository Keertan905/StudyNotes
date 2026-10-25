import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: localStorage.getItem("studyapp_registered_email") || "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const res = await authService.login({ email: form.email, password: form.password });
      login(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name}!`);
      // User flow requirement: personal info page opens after login
      navigate("/personal-info");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid email or password";
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast(`${provider} sign-in will be available soon! Please sign in with your email.`, {
      icon: "ℹ️",
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8f7fd]">
      {/* Left Column: Full-bleed Hero Section matching reference image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-screen bg-gradient-to-b from-[#5641e6] via-[#6543ea] to-[#eae5fe] relative overflow-hidden select-none items-center justify-center">
        <img
          src="/assets/images/login-hero-perfect.png"
          alt="StudyApp - Learn Smarter. Achieve More. Your AI-powered study companion"
          className="w-full h-full max-h-screen object-contain object-center"
        />
      </div>

      {/* Right Column: Clean Floating Login Card */}
      <div className="w-full lg:w-1/2 xl:w-[48%] min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f8f7fd]">
        <div className="w-full max-w-[410px] bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(89,61,238,0.08)] border border-slate-100 transition-all">
          
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
              Welcome back
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Sign in to continue your studies
            </p>
          </div>

          {/* Form Error Banner */}
          {errors.form && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>{errors.form}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Address */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="keertanraghuwanshi@gmail.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                    ${
                      errors.email
                        ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300"
                    }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs sm:text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#593dee] hover:text-[#4529d4] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                    ${
                      errors.password
                        ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[1.8]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[1.8]" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Sign in Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-1.5 py-2.5 px-4 bg-[#593dee] hover:bg-[#4b2fd9] active:scale-[0.99] disabled:opacity-70
                text-white font-semibold rounded-xl transition-all shadow-md shadow-[#593dee]/25 hover:shadow-lg hover:shadow-[#593dee]/35
                flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          {/* Social Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                or continue with
              </span>
            </div>
          </div>

          {/* Social Sign-in Options */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              className="flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              title="Continue with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleSocialLogin("GitHub")}
              className="flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              title="Continue with GitHub"
            >
              <svg className="w-4 h-4 text-slate-800" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => handleSocialLogin("Microsoft")}
              className="flex items-center justify-center py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              title="Continue with Microsoft"
            >
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-5 text-center text-xs sm:text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#593dee] font-semibold hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
