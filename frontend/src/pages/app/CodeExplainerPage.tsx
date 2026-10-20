import { useState } from 'react';
import { 
  Code2, 
  Sparkles, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  Cpu, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { codeService } from '../../services/code.service';
import type { ExplainCodeResponse } from '../../services/code.service';

const SAMPLE_SNIPPETS: { label: string; language: string; code: string }[] = [
  {
    label: "Binary Search (Java)",
    language: "java",
    code: `public class BinarySearch {
    public static int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        
        while (left <= right) {
            // Prevent integer overflow compared to (left + right) / 2
            int mid = left + (right - left) / 2;
            
            if (nums[mid] == target) {
                return mid; // Target found
            } else if (nums[mid] < target) {
                left = mid + 1; // Search right half
            } else {
                right = mid - 1; // Search left half
            }
        }
        return -1; // Target not present
    }
}`
  },
  {
    label: "LRU Cache (Python)",
    language: "python",
    code: `class Node:
    def __init__(self, key, val):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {} # map key to node
        # Left = least recently used, Right = most recently used
        self.left, self.right = Node(0, 0), Node(0, 0)
        self.left.next, self.right.prev = self.right, self.left

    def remove(self, node):
        prev, nxt = node.prev, node.next
        prev.next, nxt.prev = nxt, prev

    def insert(self, node):
        prev, nxt = self.right.prev, self.right
        prev.next = nxt.prev = node
        node.next, node.prev = nxt, prev

    def get(self, key: int) -> int:
        if key in self.cache:
            self.remove(self.cache[key])
            self.insert(self.cache[key])
            return self.cache[key].val
        return -1`
  },
  {
    label: "Reverse Linked List (C++)",
    language: "cpp",
    code: `struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    
    while (curr != nullptr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    
    return prev;
}`
  },
  {
    label: "SQL Window Functions",
    language: "sql",
    code: `SELECT 
    department_id,
    employee_id,
    salary,
    DENSE_RANK() OVER (
        PARTITION BY department_id 
        ORDER BY salary DESC
    ) as salary_rank,
    AVG(salary) OVER (
        PARTITION BY department_id
    ) as dept_avg_salary
FROM employees
WHERE active_status = 1;`
  }
];

export default function CodeExplainerPage() {
  const [code, setCode] = useState(SAMPLE_SNIPPETS[0].code);
  const [language, setLanguage] = useState(SAMPLE_SNIPPETS[0].language);
  const detailLevel = 'step_by_step';
  const goal = 'explain_and_debug';

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ExplainCodeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'lines' | 'complexity' | 'bugs' | 'challenges'>('lines');
  const [copiedFixed, setCopiedFixed] = useState(false);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error('Please enter or paste source code to analyze.');
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await codeService.explainCode({
        code: code.trim(),
        language,
        detailLevel,
        goal
      });
      setResult(res);
      setActiveTab('lines');
      toast.success('Code analysis complete! Line breakdown & complexity generated.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to explain code.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied code to clipboard!');
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">AI Code Explainer & Debugger</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Multi-Language CS Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Paste Java, Python, C++, SQL, or any code for line-by-line syntax logic, asymptotic complexity proofs, and automated bug detection.
            </p>
          </div>
        </div>

        {/* Quick Sample Algorithms Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            ⚡ Quick Snippets:
          </span>
          {SAMPLE_SNIPPETS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCode(s.code);
                setLanguage(s.language);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-medium whitespace-nowrap transition-colors border border-slate-200/60"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Editor Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            {/* Editor Top Bar */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="font-mono text-slate-400 text-xs ml-2">editor.code</span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                  <option value="javascript">JavaScript</option>
                  <option value="sql">SQL</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>

                <button
                  type="button"
                  onClick={() => setCode('')}
                  className="text-slate-400 hover:text-slate-200 p-1"
                  title="Clear code"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code Input Area with line numbers */}
            <div className="relative flex min-h-[380px] max-h-[500px]">
              <div className="py-4 px-3 bg-slate-950/60 text-slate-600 font-mono text-xs select-none text-right border-r border-slate-800/80 w-12 shrink-0">
                {Array.from({ length: Math.max(lineCount, 15) }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste or write your source code here..."
                spellCheck={false}
                className="w-full p-4 bg-transparent text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-emerald-900"
              />
            </div>

            {/* Editor Footer & Action Button */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 font-mono">
                {lineCount} lines • {code.length} chars
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !code.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analyzing Code & Complexity...' : 'Explain & Audit Code'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code Explanation & Complexity Output */}
        <div className="lg:col-span-7">
          {!result ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Code2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No Code Analyzed Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                Paste your Java, Python, C++, or SQL snippet, click "Explain & Audit Code", and receive line-by-line breakdown, time/space proofs, and bug fixes.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              {/* Output Top Header */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 via-white to-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{result.title}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white font-mono uppercase">
                      {result.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-emerald-700">
                      Time: {result.complexity.timeComplexity}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-teal-700">
                      Space: {result.complexity.spaceComplexity}
                    </span>
                    <span>•</span>
                    <span>{result.lineExplanations.length} Segments</span>
                  </div>
                </div>

                {result.bugReport.hasBugs ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Bug Identified: {result.bugReport.bugType}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Clean Execution
                  </span>
                )}
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex items-center border-b border-slate-100 px-6 gap-2 overflow-x-auto bg-slate-50/60">
                {[
                  { key: 'lines', label: `Line Breakdown (${result.lineExplanations.length})` },
                  { key: 'complexity', label: 'Complexity & Big-O' },
                  { key: 'bugs', label: result.bugReport.hasBugs ? '⚠️ Bug Fixes & Diff' : 'Security & Bugs' },
                  { key: 'challenges', label: `Challenges (${result.practiceChallenges.length})` }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-4 max-h-[640px] overflow-y-auto">
                {/* 1. Line Breakdown Tab */}
                {activeTab === 'lines' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-emerald-900 block mb-1">Architecture Summary:</strong>
                      {result.highLevelSummary}
                    </div>

                    <div className="space-y-3">
                      {result.lineExplanations.map((line, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {line.lineRange}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {line.role}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                            {line.codeSnippet}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {line.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Complexity Tab */}
                {activeTab === 'complexity' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Time Complexity Card */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 space-y-2">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4" />
                          Time Complexity
                        </div>
                        <div className="text-2xl font-black font-mono text-indigo-950">
                          {result.complexity.timeComplexity}
                        </div>
                        <p className="text-xs text-indigo-900/80 leading-relaxed">
                          {result.complexity.timeExplanation}
                        </p>
                      </div>

                      {/* Space Complexity Card */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                          <Cpu className="w-4 h-4" />
                          Auxiliary Space Complexity
                        </div>
                        <div className="text-2xl font-black font-mono text-emerald-950">
                          {result.complexity.spaceComplexity}
                        </div>
                        <p className="text-xs text-emerald-900/80 leading-relaxed">
                          {result.complexity.spaceExplanation}
                        </p>
                      </div>
                    </div>

                    {/* Bottlenecks Warning */}
                    {result.complexity.bottlenecks && result.complexity.bottlenecks.length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                        <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Potential Performance Bottlenecks
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-xs text-amber-800">
                          {result.complexity.bottlenecks.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Bug Audit Tab */}
                {activeTab === 'bugs' && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl border ${
                      result.bugReport.hasBugs 
                        ? 'bg-rose-50 border-rose-200' 
                        : 'bg-emerald-50 border-emerald-200'
                    } space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          result.bugReport.hasBugs ? 'text-rose-900' : 'text-emerald-900'
                        }`}>
                          Defect Status: {result.bugReport.bugType}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        result.bugReport.hasBugs ? 'text-rose-800' : 'text-emerald-800'
                      }`}>
                        {result.bugReport.bugDescription}
                      </p>
                    </div>

                    {result.bugReport.fixedCode && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                            Corrected / Optimized Implementation:
                          </span>
                          <button
                            onClick={() => {
                              copyToClipboard(result.bugReport.fixedCode);
                              setCopiedFixed(true);
                              setTimeout(() => setCopiedFixed(false), 2000);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            {copiedFixed ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedFixed ? 'Copied' : 'Copy Fixed Code'}</span>
                          </button>
                        </div>

                        <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
                          {result.bugReport.fixedCode}
                        </pre>

                        {result.bugReport.fixExplanation && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            <strong>Why this works:</strong> {result.bugReport.fixExplanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Challenges Tab */}
                {activeTab === 'challenges' && (
                  <div className="space-y-3">
                    {result.practiceChallenges.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            {item.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.difficulty === 'Hard'
                              ? 'bg-rose-100 text-rose-700'
                              : item.difficulty === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.prompt}
                        </p>
                        {item.hint && (
                          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900">
                            <strong>Hint:</strong> {item.hint}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
