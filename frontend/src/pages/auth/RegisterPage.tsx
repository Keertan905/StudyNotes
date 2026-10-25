import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen, Loader2, User, Mail, Lock, ArrowRight } from "lucide-react";
import { authService } from "../../services/auth.service";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    else if (form.name.trim().length < 2) e.name = "Name must be at least 2 characters";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email.trim())) e.email = "Enter a valid email address";

    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }

    if (!form.confirmPassword) e.confirmPassword = "Confirm password is required";
    else if (form.password !== form.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }

    if (!form.agreeTerms) {
      e.agreeTerms = "You must accept the terms of service";
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
      };

      await authService.register(payload);
      
      // Save email for prefilling the login page in the sequential flow:
      localStorage.setItem("studyapp_registered_email", form.email.trim());
      
      toast.success("Account created successfully! Please sign in to continue.");
      navigate("/login");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed. Please check your inputs.";
      setErrors({ form: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8f7fd]">
      {/* Left Column: Full-bleed Hero Section matching reference image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] h-screen bg-gradient-to-b from-[#5641e6] via-[#6543ea] to-[#eae5fe] relative overflow-hidden select-none items-center justify-center">
        <img
          src="/assets/images/register-hero-perfect.png"
          alt="StudyApp - Start Learning. Achieve More."
          className="w-full h-full max-h-screen object-contain object-center"
        />
      </div>

      {/* Right Column: Clean Floating Sign-Up Card */}
      <div className="w-full lg:w-1/2 xl:w-[48%] min-h-screen flex items-center justify-center p-3 sm:p-6 bg-[#f8f7fd]">
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(89,61,238,0.08)] border border-slate-100 transition-all my-auto">
          
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center mb-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[#593dee] hover:opacity-90 transition-opacity mb-1"
            >
              <BookOpen className="w-6 h-6 stroke-[2.4]" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">StudyApp</span>
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Create your account
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Join StudyApp and start your learning journey
            </p>
          </div>

          {/* Form Error Banner */}
          {errors.form && (
            <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span>{errors.form}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="register-name"
                className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                  className={`w-full pl-10 pr-4 py-2 bg-white rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                    ${
                      errors.name
                        ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300"
                    }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email address"
                  className={`w-full pl-10 pr-4 py-2 bg-white rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
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
              <label
                htmlFor="register-password"
                className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-10 py-2 bg-white rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
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
              <p className="text-[11px] text-slate-400 mt-1">
                At least 8 characters with letters, numbers & symbols
              </p>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-10 py-2 bg-white rounded-xl border text-sm text-slate-800 placeholder-slate-400 outline-none transition-all
                    ${
                      errors.confirmPassword
                        ? "border-red-400 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[1.8]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[1.8]" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Agree Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#593dee] focus:ring-[#593dee]/20 accent-[#593dee]"
                />
                <span>
                  I agree to the{" "}
                  <span className="text-[#593dee] font-medium hover:underline">Terms of Service</span> and{" "}
                  <span className="text-[#593dee] font-medium hover:underline">Privacy Policy</span>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.agreeTerms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-[#593dee] hover:bg-[#4b2fd9] active:scale-[0.99] disabled:opacity-70
                text-white font-semibold rounded-xl transition-all shadow-md shadow-[#593dee]/25 hover:shadow-lg hover:shadow-[#593dee]/35
                flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-4 text-center text-xs sm:text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#593dee] font-semibold hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
