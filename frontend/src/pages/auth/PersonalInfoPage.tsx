import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  User,
  Mail,
  Phone,
  Calendar,
  Sliders,
  GraduationCap,
  MapPin,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function PersonalInfoPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "Keertan Raghuwanshi",
    email: user?.email || "keertanraghuwanshi@gmail.com",
    phone: "",
    dob: "",
    gender: "",
    branch: "B.Tech CSIT",
    year: "3rd Year",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setForm((prev) => ({ ...prev, name: user.name }));
    if (user?.email) setForm((prev) => ({ ...prev, email: user.email }));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Save profile details to local storage
      const profileData = {
        ...form,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem("studyapp_profile", JSON.stringify(profileData));
      localStorage.setItem("studyapp_profile_completed", "true");

      toast.success("Profile saved! Welcome to your Study Dashboard.");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    toast("You can complete your profile anytime in Settings.", { icon: "ℹ️" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8f7fd]">
      {/* Left Column: Full-bleed Hero Section matching reference image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[50%] h-screen bg-gradient-to-b from-[#5641e6] via-[#6543ea] to-[#eae5fe] relative overflow-hidden select-none items-center justify-center">
        <img
          src="/assets/images/profile-hero-perfect.png"
          alt="StudyApp - Complete Your Profile"
          className="w-full h-full max-h-screen object-contain object-center"
        />
      </div>

      {/* Right Column: Clean Floating Personal Info Card */}
      <div className="w-full lg:w-1/2 xl:w-[50%] min-h-screen flex items-center justify-center p-3 sm:p-6 bg-[#f8f7fd] py-4">
        <div className="w-full max-w-[430px] bg-white rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(89,61,238,0.08)] border border-slate-100 transition-all my-auto max-h-[96vh] overflow-y-auto">
          
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
              Personal Information
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Help us get to know you better
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50/60 rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 text-xs sm:text-sm text-slate-700 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Date of Birth (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="text"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  placeholder="dd/mm/yyyy"
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Gender (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Sliders className="w-4 h-4 stroke-[1.8]" />
                </div>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-xs sm:text-sm text-slate-800 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Course / Branch */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Course / Branch <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <GraduationCap className="w-4 h-4 stroke-[1.8]" />
                </div>
                <select
                  required
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-xs sm:text-sm text-slate-800 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="B.Tech CSIT">B.Tech CSIT</option>
                  <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                  <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                  <option value="B.Tech Electronics & Comm.">B.Tech Electronics & Comm.</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                  <option value="Other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 stroke-[1.8]" />
                </div>
                <select
                  required
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-white rounded-xl border border-slate-200 focus:border-[#593dee] focus:ring-4 focus:ring-[#593dee]/10 hover:border-slate-300 text-xs sm:text-sm text-slate-800 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 bg-[#593dee] hover:bg-[#4b2fd9] active:scale-[0.99] disabled:opacity-70
                text-white font-semibold rounded-xl transition-all shadow-md shadow-[#593dee]/25 hover:shadow-lg hover:shadow-[#593dee]/35
                flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          {/* Skip for now */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs sm:text-sm font-medium text-slate-500 hover:text-[#593dee] transition-colors cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
