import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  Sparkles, 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [degree, setDegree] = useState(user?.college ? "B.Tech / B.E." : "B.Tech / B.E.");
  const [department, setDepartment] = useState(user?.branch || "Computer Science");
  const [semester, setSemester] = useState<number>(user?.semester || 6);
  const [subjects, setSubjects] = useState("Operating Systems, Database Management Systems, Computer Networks");
  const [examDate, setExamDate] = useState("2026-11-15");
  const [dailyHours, setDailyHours] = useState("2-3 hours");
  const [explanationStyle, setExplanationStyle] = useState("concise");
  const [studyGoal, setStudyGoal] = useState("top_grades");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const onboardingData = {
      degree,
      department,
      semester,
      subjects: subjects.split(",").map(s => s.trim()).filter(Boolean),
      examDate,
      dailyHours,
      explanationStyle,
      studyGoal,
      completedAt: new Date().toISOString()
    };

    localStorage.setItem("studyapp_onboarding", JSON.stringify(onboardingData));
    localStorage.setItem("studyapp_preferences", JSON.stringify({
      explanationStyle,
      dailyHours,
      studyGoal
    }));

    toast.success("Preferences saved! Welcome to your Study Workspace.");
    navigate("/dashboard");
  };

  const handleSkip = () => {
    toast("You can update your study preferences anytime in Settings.", { icon: "ℹ️" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personalized Setup</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Tailor Your Study Experience
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
            Let StudyApp customize AI notes, quiz difficulty, and countdown schedules to your curriculum.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-200 p-8 sm:p-10">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Academic Information */}
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>1. Academic Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Degree / Program</label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                    <option value="B.Sc">B.Sc</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="Other">Other Undergraduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Department / Major</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Current Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subjects to study */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Target Subjects this Semester (comma separated)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="Operating Systems, DBMS, Computer Networks, Discrete Math"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  You can upload complete PDF syllabi for these subjects inside the workspace.
                </p>
              </div>
            </div>

            {/* Exam & Time Availability */}
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>2. Schedule & Daily Availability</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Target Examination Start Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Available Daily Study Time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["1-2 hours", "2-3 hours", "4+ hours"].map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setDailyHours(time)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                          dailyHours === time
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Explanation Style & Study Goal */}
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>3. Preferred AI Style & Academic Goals</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => setExplanationStyle("concise")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    explanationStyle === "concise"
                      ? "border-indigo-600 bg-indigo-50/60 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Exam-Oriented</span>
                    {explanationStyle === "concise" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Concise definitions, key formula bullets, pros/cons, and direct answer templates.
                  </p>
                </div>

                <div
                  onClick={() => setExplanationStyle("intuitive")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    explanationStyle === "intuitive"
                      ? "border-indigo-600 bg-indigo-50/60 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Intuitive & Analogies</span>
                    {explanationStyle === "intuitive" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Step-by-step intuitive guidance, real-world examples, and memorable mental models.
                  </p>
                </div>

                <div
                  onClick={() => setExplanationStyle("rigorous")}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    explanationStyle === "rigorous"
                      ? "border-indigo-600 bg-indigo-50/60 shadow-xs"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Deep Academic</span>
                    {explanationStyle === "rigorous" && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Theoretical depth, mathematical formulations, architecture trade-offs, and proofs.
                  </p>
                </div>
              </div>

              {/* Goal choices */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Primary Study Goal</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "top_grades", title: "Target Distinction / Top GPA", icon: Target },
                    { id: "master_basics", title: "Clear Backlogs & Core Concepts", icon: BookOpen },
                    { id: "exam_sprint", title: "Fast Semester Exam Revision", icon: Clock },
                  ].map(g => {
                    const GIcon = g.icon;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setStudyGoal(g.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                          studyGoal === g.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold"
                            : "border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <GIcon className={`w-4 h-4 ${studyGoal === g.id ? "text-indigo-600" : "text-slate-400"}`} />
                        <span className="text-xs">{g.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors order-2 sm:order-1"
              >
                Skip for now, configure later
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
              >
                <span>Save & Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
