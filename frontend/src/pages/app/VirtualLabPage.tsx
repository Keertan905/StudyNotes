import { useState, useEffect } from 'react';
import {
  FlaskConical,
  Cpu,
  Network,
  Zap,
  Activity,
  Play,
  RotateCcw,
  Award,
  BookOpen,
  Sliders,
  Flame,
  Plus,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  virtualLabService,
  type ExperimentDetail,
  type AssessmentResult
} from '../../services/virtualLab.service';

interface ProcessItem {
  id: string;
  arrival: number;
  burst: number;
  priority: number;
  color: string;
}

export default function VirtualLabPage() {
  const [activeTab, setActiveTab] = useState<'cpu-scheduling' | 'packet-routing' | 'logic-gates' | 'ohms-law'>('cpu-scheduling');
  const [currentDetail, setCurrentDetail] = useState<ExperimentDetail | null>(null);

  // Tab mode: Simulation vs Theory vs Post-Quiz
  const [viewMode, setViewMode] = useState<'sim' | 'theory' | 'quiz'>('sim');

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<AssessmentResult | null>(null);

  // ----------------------------------------------------
  // SIMULATION 1: CPU SCHEDULING STATE
  // ----------------------------------------------------
  const [cpuAlgorithm, setCpuAlgorithm] = useState<'FCFS' | 'RR' | 'SJF' | 'PRIORITY'>('RR');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [processes, setProcesses] = useState<ProcessItem[]>([
    { id: 'P1', arrival: 0, burst: 5, priority: 2, color: '#3b82f6' },
    { id: 'P2', arrival: 1, burst: 3, priority: 1, color: '#10b981' },
    { id: 'P3', arrival: 2, burst: 8, priority: 3, color: '#f59e0b' },
    { id: 'P4', arrival: 3, burst: 2, priority: 4, color: '#ec4899' },
  ]);
  const [ganttTimeline, setGanttTimeline] = useState<{ processId: string; start: number; end: number; color: string }[]>([]);
  const [cpuMetrics, setCpuMetrics] = useState({ avgWaiting: 0, avgTurnaround: 0, cpuUtilization: 100 });

  // ----------------------------------------------------
  // SIMULATION 2: NETWORK PACKET ROUTING STATE
  // ----------------------------------------------------
  const [packetType, setPacketType] = useState<'TCP' | 'HTTP' | 'UDP' | 'ICMP'>('HTTP');
  const [brokenLinks, setBrokenLinks] = useState<Set<string>>(new Set());
  const [hopLog, setHopLog] = useState<{ hop: string; delay: number; ttl: number }[]>([]);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // ----------------------------------------------------
  // SIMULATION 3: LOGIC GATES STATE
  // ----------------------------------------------------
  const [circuitPreset, setCircuitPreset] = useState<'SINGLE_AND' | 'SINGLE_XOR' | 'HALF_ADDER' | 'FULL_ADDER' | 'MUX'>('HALF_ADDER');
  const [inputA, setInputA] = useState(false);
  const [inputB, setInputB] = useState(false);
  const [inputC, setInputC] = useState(false);

  // ----------------------------------------------------
  // SIMULATION 4: OHM'S LAW STATE
  // ----------------------------------------------------
  const [voltage, setVoltage] = useState(12); // Volts
  const [resistance, setResistance] = useState(240); // Ohms
  const [isCircuitClosed, setIsCircuitClosed] = useState(true);



  useEffect(() => {
    loadExperimentDetail(activeTab);
    setSelectedAnswers({});
    setQuizResult(null);
    setViewMode('sim');
  }, [activeTab]);

  const loadExperimentDetail = async (id: string) => {
    try {
      const data = await virtualLabService.getExperimentById(id);
      setCurrentDetail(data);
    } catch {
      // ignore
    }
  };

  // ----------------------------------------------------
  // CPU SCHEDULING LOGIC
  // ----------------------------------------------------
  const calculateCpuSchedule = () => {
    if (processes.length === 0) return;

    // Deep copy process list
    const procs = processes.map((p) => ({ ...p, remaining: p.burst }));
    const timeline: { processId: string; start: number; end: number; color: string }[] = [];
    let t = 0;
    const completed: { [id: string]: { completion: number; tat: number; wt: number } } = {};

    if (cpuAlgorithm === 'FCFS') {
      const sorted = [...procs].sort((a, b) => a.arrival - b.arrival);
      sorted.forEach((p) => {
        if (t < p.arrival) t = p.arrival;
        const start = t;
        t += p.burst;
        timeline.push({ processId: p.id, start, end: t, color: p.color });
        completed[p.id] = {
          completion: t,
          tat: t - p.arrival,
          wt: t - p.arrival - p.burst,
        };
      });
    } else if (cpuAlgorithm === 'SJF') {
      // Non-preemptive Shortest Job First
      const pending = [...procs];
      while (pending.length > 0) {
        const available = pending.filter((p) => p.arrival <= t);
        if (available.length === 0) {
          t++;
          continue;
        }
        available.sort((a, b) => a.burst - b.burst);
        const p = available[0];
        const start = t;
        t += p.burst;
        timeline.push({ processId: p.id, start, end: t, color: p.color });
        completed[p.id] = {
          completion: t,
          tat: t - p.arrival,
          wt: t - p.arrival - p.burst,
        };
        const idx = pending.findIndex((x) => x.id === p.id);
        pending.splice(idx, 1);
      }
    } else if (cpuAlgorithm === 'PRIORITY') {
      // Lower number = higher priority
      const pending = [...procs];
      while (pending.length > 0) {
        const available = pending.filter((p) => p.arrival <= t);
        if (available.length === 0) {
          t++;
          continue;
        }
        available.sort((a, b) => a.priority - b.priority);
        const p = available[0];
        const start = t;
        t += p.burst;
        timeline.push({ processId: p.id, start, end: t, color: p.color });
        completed[p.id] = {
          completion: t,
          tat: t - p.arrival,
          wt: t - p.arrival - p.burst,
        };
        const idx = pending.findIndex((x) => x.id === p.id);
        pending.splice(idx, 1);
      }
    } else {
      // ROUND ROBIN
      const queue: { id: string; arrival: number; burst: number; remaining: number; color: string }[] = [];
      const remainingProcs = [...procs].sort((a, b) => a.arrival - b.arrival);
      let i = 0;

      while (queue.length > 0 || i < remainingProcs.length) {
        while (i < remainingProcs.length && remainingProcs[i].arrival <= t) {
          queue.push(remainingProcs[i]);
          i++;
        }

        if (queue.length === 0) {
          t++;
          continue;
        }

        const current = queue.shift()!;
        const execTime = Math.min(timeQuantum, current.remaining);
        const start = t;
        t += execTime;
        current.remaining -= execTime;

        timeline.push({ processId: current.id, start, end: t, color: current.color });

        while (i < remainingProcs.length && remainingProcs[i].arrival <= t) {
          queue.push(remainingProcs[i]);
          i++;
        }

        if (current.remaining > 0) {
          queue.push(current);
        } else {
          completed[current.id] = {
            completion: t,
            tat: t - current.arrival,
            wt: t - current.arrival - current.burst,
          };
        }
      }
    }

    setGanttTimeline(timeline);

    // Compute metrics
    const procIds = Object.keys(completed);
    if (procIds.length > 0) {
      const sumWt = procIds.reduce((acc, id) => acc + completed[id].wt, 0);
      const sumTat = procIds.reduce((acc, id) => acc + completed[id].tat, 0);
      setCpuMetrics({
        avgWaiting: Math.round((sumWt / procIds.length) * 10) / 10,
        avgTurnaround: Math.round((sumTat / procIds.length) * 10) / 10,
        cpuUtilization: t > 0 ? 100 : 0,
      });
    }
  };

  useEffect(() => {
    calculateCpuSchedule();
  }, [cpuAlgorithm, timeQuantum, processes]);

  const addProcess = () => {
    const nextNum = processes.length + 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    setProcesses((prev) => [
      ...prev,
      {
        id: `P${nextNum}`,
        arrival: Math.floor(Math.random() * 4),
        burst: Math.floor(Math.random() * 6) + 2,
        priority: Math.floor(Math.random() * 4) + 1,
        color: colors[nextNum % colors.length],
      },
    ]);
  };

  const removeProcess = (id: string) => {
    if (processes.length <= 1) {
      toast.error('Simulation requires at least 1 process');
      return;
    }
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  };

  // ----------------------------------------------------
  // NETWORK ROUTING SIMULATION
  // ----------------------------------------------------
  const toggleLink = (linkId: string) => {
    setBrokenLinks((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  };

  const transmitPacket = () => {
    if (isTransmitting) return;

    // Dijkstra dynamic shortest path calculation based on broken links
    let path = ['Client'];
    if (!brokenLinks.has('Client-R1')) {
      path.push('R1');
      if (!brokenLinks.has('R1-R3')) {
        path.push('R3');
      } else if (!brokenLinks.has('R1-R2')) {
        path.push('R2', 'R4');
      }
    } else if (!brokenLinks.has('Client-R2')) {
      path.push('R2');
      if (!brokenLinks.has('R2-R4')) {
        path.push('R4');
      }
    }

    if (!brokenLinks.has(`${path[path.length - 1]}-WebServer`)) {
      path.push('WebServer');
    }

    setIsTransmitting(true);

    const logs: { hop: string; delay: number; ttl: number }[] = [];
    let ttl = 16;

    let step = 0;
    const interval = setInterval(() => {
      if (step < path.length - 1) {
        const from = path[step];
        const to = path[step + 1];
        ttl -= 1;
        logs.push({
          hop: `${from} ➔ ${to}`,
          delay: Math.floor(Math.random() * 15) + 10,
          ttl,
        });
        setHopLog([...logs]);
        step++;
      } else {
        clearInterval(interval);
        setIsTransmitting(false);
        if (path[path.length - 1] === 'WebServer') {
          toast.success(`Packet delivered to WebServer (${logs.length} hops)`);
        } else {
          toast.error(`Packet dropped! Broken link detected at ${path[path.length - 1]}`);
        }
      }
    }, 700);
  };

  // ----------------------------------------------------
  // LOGIC GATE CALCULATIONS
  // ----------------------------------------------------
  const getLogicGateOutputs = () => {
    const a = inputA ? 1 : 0;
    const b = inputB ? 1 : 0;
    const c = inputC ? 1 : 0;

    switch (circuitPreset) {
      case 'SINGLE_AND':
        return { out1: (a && b) as number, label1: 'AND (A · B)' };
      case 'SINGLE_XOR':
        return { out1: (a ^ b) as number, label1: 'XOR (A ⊕ B)' };
      case 'HALF_ADDER':
        return {
          out1: (a ^ b) as number,
          label1: 'Sum (A ⊕ B)',
          out2: (a && b) as number,
          label2: 'Carry (A · B)',
        };
      case 'FULL_ADDER': {
        const sum = (a ^ b ^ c) as number;
        const carry = ((a && b) || (b && c) || (a && c)) as number;
        return {
          out1: sum,
          label1: 'Sum (A ⊕ B ⊕ Cin)',
          out2: carry,
          label2: 'Cout',
        };
      }
      case 'MUX': {
        // Select = C, I0 = A, I1 = B
        const muxOut = c ? b : a;
        return {
          out1: muxOut,
          label1: 'MUX Out (S ? B : A)',
        };
      }
      default:
        return { out1: 0, label1: 'Out' };
    }
  };

  const logicOutputs = getLogicGateOutputs();

  // ----------------------------------------------------
  // OHM'S LAW CALCULATIONS
  // ----------------------------------------------------
  const currentAmps = isCircuitClosed && resistance > 0 ? voltage / resistance : 0;
  const currentMilliAmps = Math.round(currentAmps * 1000 * 10) / 10;
  const powerWatts = isCircuitClosed ? Math.round(voltage * currentAmps * 100) / 100 : 0;
  const isOverheating = powerWatts > 0.5; // Standard 1/2W resistor threshold

  // ----------------------------------------------------
  // QUIZ SUBMISSION
  // ----------------------------------------------------
  const handleSubmitQuiz = async () => {
    if (!currentDetail) return;
    if (Object.keys(selectedAnswers).length < currentDetail.quizQuestions.length) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const res = await virtualLabService.submitAssessment({
        experimentId: currentDetail.id,
        selectedAnswers,
      });
      setQuizResult(res);
      if (res.passed) {
        toast.success(`Passed! +${res.xpAwarded} XP awarded!`, { icon: '🎉' });
      } else {
        toast.error('Did not meet pass threshold. Review theory and try again!');
      }
    } catch {
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600/10 text-emerald-600 rounded-lg">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive Virtual Lab</h1>
              <p className="text-sm text-slate-500">
                Simulate computer science, networking, electronics, and physics experiments with real logic & assessments
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('sim')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'sim'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setViewMode('theory')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'theory'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Theory & Guide</span>
          </button>
          <button
            onClick={() => setViewMode('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'quiz'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Post-Lab Quiz</span>
          </button>
        </div>
      </div>

      {/* Lab Experiment Navigation Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'cpu-scheduling', title: 'CPU Scheduling', icon: Cpu, sub: 'Operating Systems', cat: 'CS' },
          { id: 'packet-routing', title: 'Packet Routing', icon: Network, sub: 'Computer Networks', cat: 'Net' },
          { id: 'logic-gates', title: 'Logic Gates & Circuits', icon: Zap, sub: 'Digital Electronics', cat: 'EE' },
          { id: 'ohms-law', title: 'Ohm’s Law & Circuits', icon: Activity, sub: 'Physics & DC Circuits', cat: 'Physics' },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {item.cat}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-500">{item.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace based on viewMode */}
      {viewMode === 'sim' ? (
        <div className="space-y-6">
          {/* SIMULATION 1: CPU SCHEDULING */}
          {activeTab === 'cpu-scheduling' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Algorithm:</span>
                  {(['FCFS', 'RR', 'SJF', 'PRIORITY'] as const).map((algo) => (
                    <button
                      key={algo}
                      onClick={() => setCpuAlgorithm(algo)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        cpuAlgorithm === algo
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {algo === 'RR' ? 'Round Robin' : algo}
                    </button>
                  ))}
                </div>

                {cpuAlgorithm === 'RR' && (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                    <span className="text-xs font-medium text-slate-600">Time Quantum (q):</span>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={timeQuantum}
                      onChange={(e) => setTimeQuantum(Number(e.target.value))}
                      className="w-24 accent-emerald-600"
                    />
                    <span className="text-xs font-bold text-emerald-700 w-4">{timeQuantum}</span>
                  </div>
                )}

                <button
                  onClick={addProcess}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Add Process</span>
                </button>
              </div>

              {/* Process Configuration Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Process Table</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-y border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Process</th>
                        <th className="px-3 py-2">Arrival Time (ms)</th>
                        <th className="px-3 py-2">Burst Time (ms)</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {processes.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-bold text-slate-900">{p.id}</span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max="15"
                              value={p.arrival}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setProcesses((prev) =>
                                  prev.map((x) => (x.id === p.id ? { ...x, arrival: val } : x))
                                );
                              }}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-slate-800"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={p.burst}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value));
                                setProcesses((prev) =>
                                  prev.map((x) => (x.id === p.id ? { ...x, burst: val } : x))
                                );
                              }}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-slate-800"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={p.priority}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setProcesses((prev) =>
                                  prev.map((x) => (x.id === p.id ? { ...x, priority: val } : x))
                                );
                              }}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-slate-800"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeProcess(p.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Gantt Chart */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Computed Gantt Chart Timeline
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl overflow-x-auto">
                  <div className="flex items-center min-w-[500px]">
                    {ganttTimeline.map((slot, idx) => {
                      const duration = slot.end - slot.start;
                      const widthPct = Math.max(8, duration * 30);
                      return (
                        <div
                          key={idx}
                          style={{ width: `${widthPct}px`, backgroundColor: slot.color }}
                          className="h-12 border-r border-slate-900 flex flex-col items-center justify-center text-white relative transition-all"
                        >
                          <span className="text-xs font-bold">{slot.processId}</span>
                          <span className="text-[10px] opacity-80">{duration}ms</span>
                          <span className="absolute -bottom-5 left-0 text-[10px] text-slate-400 font-mono">
                            {slot.start}
                          </span>
                          {idx === ganttTimeline.length - 1 && (
                            <span className="absolute -bottom-5 right-0 text-[10px] text-slate-400 font-mono">
                              {slot.end}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Computed Metrics summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl text-center">
                  <span className="text-xs font-medium text-emerald-800">Average Waiting Time</span>
                  <div className="text-2xl font-bold text-emerald-900 mt-1">{cpuMetrics.avgWaiting} ms</div>
                </div>
                <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-center">
                  <span className="text-xs font-medium text-indigo-800">Average Turnaround Time</span>
                  <div className="text-2xl font-bold text-indigo-900 mt-1">{cpuMetrics.avgTurnaround} ms</div>
                </div>
                <div className="p-4 bg-amber-50/70 border border-amber-100 rounded-xl text-center">
                  <span className="text-xs font-medium text-amber-800">CPU Utilization</span>
                  <div className="text-2xl font-bold text-amber-900 mt-1">{cpuMetrics.cpuUtilization}%</div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 2: NETWORK PACKET ROUTING */}
          {activeTab === 'packet-routing' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Packet Type:</span>
                  {(['HTTP', 'TCP', 'UDP', 'ICMP'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPacketType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        packetType === type
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={transmitPacket}
                    disabled={isTransmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isTransmitting ? 'Transmitting...' : 'Send Packet'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setBrokenLinks(new Set());
                      setHopLog([]);
                    }}
                    className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                    title="Reset Network"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Network Topology Visualizer */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 h-[340px] flex items-center justify-between overflow-hidden">
                {/* SVG Connecting Links */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Links */}
                  {[
                    { id: 'Client-R1', x1: 90, y1: 170, x2: 250, y2: 90 },
                    { id: 'Client-R2', x1: 90, y1: 170, x2: 250, y2: 250 },
                    { id: 'R1-R3', x1: 250, y1: 90, x2: 450, y2: 90 },
                    { id: 'R1-R2', x1: 250, y1: 90, x2: 250, y2: 250 },
                    { id: 'R2-R4', x1: 250, y1: 250, x2: 450, y2: 250 },
                    { id: 'R3-WebServer', x1: 450, y1: 90, x2: 620, y2: 170 },
                    { id: 'R4-WebServer', x1: 450, y1: 250, x2: 620, y2: 170 },
                  ].map((l) => {
                    const isBroken = brokenLinks.has(l.id);
                    return (
                      <line
                        key={l.id}
                        x1={l.x1}
                        y1={l.y1}
                        x2={l.x2}
                        y2={l.y2}
                        stroke={isBroken ? '#ef4444' : '#475569'}
                        strokeWidth={isBroken ? '3' : '2'}
                        strokeDasharray={isBroken ? '6,6' : undefined}
                      />
                    );
                  })}
                </svg>

                {/* Nodes */}
                <div className="z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl bg-blue-600 border-2 border-white flex flex-col items-center justify-center text-white shadow-lg">
                    <span className="text-xs font-bold">Client</span>
                    <span className="text-[10px] opacity-80">192.168.1.5</span>
                  </div>
                </div>

                <div className="z-10 flex flex-col justify-between h-56">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-500 flex flex-col items-center justify-center text-white shadow-lg">
                    <span className="text-xs font-bold">Router 1</span>
                    <span className="text-[10px] opacity-75">10.0.1.1</span>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-500 flex flex-col items-center justify-center text-white shadow-lg">
                    <span className="text-xs font-bold">Router 2</span>
                    <span className="text-[10px] opacity-75">10.0.2.1</span>
                  </div>
                </div>

                <div className="z-10 flex flex-col justify-between h-56">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-500 flex flex-col items-center justify-center text-white shadow-lg">
                    <span className="text-xs font-bold">Router 3</span>
                    <span className="text-[10px] opacity-75">10.0.3.1</span>
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-500 flex flex-col items-center justify-center text-white shadow-lg">
                    <span className="text-xs font-bold">Router 4</span>
                    <span className="text-[10px] opacity-75">10.0.4.1</span>
                  </div>
                </div>

                <div className="z-10 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl bg-emerald-600 border-2 border-white flex flex-col items-center justify-center text-white shadow-lg">
                    <span className="text-xs font-bold">Server</span>
                    <span className="text-[10px] opacity-80">203.0.113.8</span>
                  </div>
                </div>
              </div>

              {/* Link Failure Simulation Toggles */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Simulate Link Faults (Click to toggle Break / Restore):
                </span>
                <div className="flex flex-wrap gap-2">
                  {['Client-R1', 'Client-R2', 'R1-R3', 'R1-R2', 'R2-R4', 'R3-WebServer', 'R4-WebServer'].map(
                    (link) => {
                      const isBroken = brokenLinks.has(link);
                      return (
                        <button
                          key={link}
                          onClick={() => toggleLink(link)}
                          className={`text-xs px-2.5 py-1 rounded-md border font-mono transition ${
                            isBroken
                              ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {link} {isBroken ? '🔴 (Severed)' : '🟢 (Active)'}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Hop-by-Hop Transmission Log */}
              {hopLog.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Hop-by-Hop Forwarding & Latency Log
                  </h4>
                  <div className="space-y-1 font-mono text-xs">
                    {hopLog.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between text-slate-700">
                        <span>{log.hop}</span>
                        <span className="text-slate-400">Delay: {log.delay}ms</span>
                        <span className="text-indigo-600 font-bold">TTL: {log.ttl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SIMULATION 3: LOGIC GATES */}
          {activeTab === 'logic-gates' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Presets */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Circuit Preset:</span>
                  {[
                    { id: 'HALF_ADDER', label: 'Half Adder' },
                    { id: 'FULL_ADDER', label: 'Full Adder' },
                    { id: 'SINGLE_AND', label: 'AND Gate' },
                    { id: 'SINGLE_XOR', label: 'XOR Gate' },
                    { id: 'MUX', label: '2:1 Multiplexer' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setCircuitPreset(preset.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        circuitPreset === preset.id
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Breadboard Workspace */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-950 p-6 rounded-2xl text-white">
                {/* Inputs */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Input Switches
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-sm">Switch A</span>
                      <button
                        onClick={() => setInputA((v) => !v)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          inputA ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {inputA ? 'HIGH (1)' : 'LOW (0)'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-sm">Switch B</span>
                      <button
                        onClick={() => setInputB((v) => !v)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          inputB ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {inputB ? 'HIGH (1)' : 'LOW (0)'}
                      </button>
                    </div>

                    {(circuitPreset === 'FULL_ADDER' || circuitPreset === 'MUX') && (
                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-sm">
                          {circuitPreset === 'MUX' ? 'Select (S)' : 'Carry In (Cin)'}
                        </span>
                        <button
                          onClick={() => setInputC((v) => !v)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            inputC ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {inputC ? 'HIGH (1)' : 'LOW (0)'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Circuit Center Schematic Diagram */}
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-center space-y-2">
                  <Zap className="w-8 h-8 mx-auto text-amber-400 animate-pulse" />
                  <span className="font-bold text-sm text-slate-200 block">
                    {circuitPreset.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-slate-400">
                    Propagating logical voltage gates in nanosecond response time.
                  </p>
                </div>

                {/* Outputs LEDs */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Output Indicators
                  </span>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-bold text-sm">{logicOutputs.label1}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full transition-all ${
                            logicOutputs.out1
                              ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 scale-110'
                              : 'bg-slate-700'
                          }`}
                        />
                        <span className="font-mono font-bold text-xs">
                          {logicOutputs.out1 ? '1' : '0'}
                        </span>
                      </div>
                    </div>

                    {logicOutputs.label2 && (
                      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-sm">{logicOutputs.label2}</span>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full transition-all ${
                              logicOutputs.out2
                                ? 'bg-emerald-400 shadow-lg shadow-emerald-400/80 scale-110'
                                : 'bg-slate-700'
                            }`}
                          />
                          <span className="font-mono font-bold text-xs">
                            {logicOutputs.out2 ? '1' : '0'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Live Truth Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Truth Table Verification (Active Row Highlighted)
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="px-4 py-2">A</th>
                        <th className="px-4 py-2">B</th>
                        {circuitPreset === 'FULL_ADDER' && <th className="px-4 py-2">Cin</th>}
                        {circuitPreset === 'MUX' && <th className="px-4 py-2">Select</th>}
                        <th className="px-4 py-2">{logicOutputs.label1}</th>
                        {logicOutputs.label2 && <th className="px-4 py-2">{logicOutputs.label2}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {[
                        { a: 0, b: 0, c: 0 },
                        { a: 0, b: 1, c: 0 },
                        { a: 1, b: 0, c: 0 },
                        { a: 1, b: 1, c: 0 },
                      ].map((row, idx) => {
                        const isActive =
                          (inputA ? 1 : 0) === row.a &&
                          (inputB ? 1 : 0) === row.b;
                        return (
                          <tr
                            key={idx}
                            className={`transition ${
                              isActive ? 'bg-amber-100/70 font-bold text-amber-900' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-2">{row.a}</td>
                            <td className="px-4 py-2">{row.b}</td>
                            {circuitPreset === 'FULL_ADDER' && <td className="px-4 py-2">{row.c}</td>}
                            {circuitPreset === 'MUX' && <td className="px-4 py-2">{row.c}</td>}
                            <td className="px-4 py-2">
                              {circuitPreset === 'HALF_ADDER' ? row.a ^ row.b : row.a & row.b}
                            </td>
                            {logicOutputs.label2 && (
                              <td className="px-4 py-2">{row.a & row.b}</td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION 4: OHM'S LAW */}
          {activeTab === 'ohms-law' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Sliders & Circuit Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>DC Voltage (V):</span>
                    <span className="text-indigo-600 font-mono text-sm">{voltage} V</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    step="1"
                    value={voltage}
                    onChange={(e) => setVoltage(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1V</span>
                    <span>12V</span>
                    <span>24V</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Resistance (R):</span>
                    <span className="text-indigo-600 font-mono text-sm">{resistance} Ω</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={resistance}
                    onChange={(e) => setResistance(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10Ω</span>
                    <span>500Ω</span>
                    <span>1000Ω</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <button
                    onClick={() => setIsCircuitClosed((v) => !v)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                      isCircuitClosed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    Circuit Switch: {isCircuitClosed ? 'CLOSED (Conducting)' : 'OPEN (Zero Current)'}
                  </button>
                </div>
              </div>

              {/* Animated Circuit Visualizer */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Animated Electron Flow (Drift Speed ∝ Current)</span>
                  {isOverheating && (
                    <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                      <Flame className="w-4 h-4" /> Resistor Overheating ({powerWatts}W &gt; 0.5W)
                    </span>
                  )}
                </div>

                {/* Circuit Diagram with Electron Drift Animation */}
                <div className="relative h-44 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-around overflow-hidden">
                  {/* Battery Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-20 bg-indigo-600 border border-white rounded-lg flex flex-col items-center justify-center font-bold">
                      <span className="text-xs text-indigo-200">+</span>
                      <span className="text-sm">{voltage}V</span>
                      <span className="text-xs text-indigo-200">-</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">DC Source</span>
                  </div>

                  {/* Electron Flow Stream */}
                  {isCircuitClosed && (
                    <div className="flex items-center gap-3">
                      {[1, 2, 3, 4, 5, 6].map((e) => (
                        <div
                          key={e}
                          className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80 animate-ping"
                          style={{
                            animationDuration: `${Math.max(0.3, 2.5 - currentAmps * 15)}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Resistor Node */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-24 h-12 rounded-lg border flex flex-col items-center justify-center font-bold transition-all ${
                        isOverheating
                          ? 'bg-rose-900/80 border-rose-500 text-rose-200 animate-pulse'
                          : 'bg-slate-800 border-amber-500 text-amber-200'
                      }`}
                    >
                      <span className="text-xs">{resistance} Ω</span>
                      <span className="text-[10px] opacity-80">{powerWatts}W</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Load Resistor</span>
                  </div>
                </div>

                {/* Live Meter Readings */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Current (I = V / R)</span>
                    <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                      {currentMilliAmps} mA
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Voltage (V)</span>
                    <div className="text-lg font-mono font-bold text-indigo-400 mt-0.5">
                      {isCircuitClosed ? voltage : 0} V
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400">Power Dissipated (P)</span>
                    <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                      {powerWatts} W
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : viewMode === 'theory' ? (
        /* THEORY & GUIDE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {currentDetail ? (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  {currentDetail.subject} • {currentDetail.difficulty}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{currentDetail.title}</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{currentDetail.description}</p>
              </div>

              {/* Objective */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Learning Objective
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">{currentDetail.objective}</p>
              </div>

              {/* Theory Points */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Fundamental Theory
                </h4>
                <ul className="space-y-2">
                  {currentDetail.theoryPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Formulas */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Mathematical & Algorithmic Formulas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentDetail.formulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-indigo-700 font-semibold"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step instructions */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Step-by-Step Lab Instructions
                </h4>
                <div className="space-y-2">
                  {currentDetail.stepInstructions.map((step, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-700">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">Loading lab manual...</div>
          )}
        </div>
      ) : (
        /* POST-LAB ASSESSMENT QUIZ */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          {currentDetail ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Post-Lab Assessment: {currentDetail.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Answer the diagnostic questions below to verify concept mastery and earn XP points.
                  </p>
                </div>
                {quizResult && (
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      quizResult.passed
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    Score: {quizResult.scorePercentage}% ({quizResult.correctCount}/{quizResult.totalQuestions})
                  </div>
                )}
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {currentDetail.quizQuestions.map((q, idx) => {
                  const selected = selectedAnswers[q.id];
                  const qRes = quizResult?.questionResults.find((r) => r.questionId === q.id);

                  return (
                    <div key={q.id} className="p-4 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-sm text-slate-900">
                          {idx + 1}. {q.question}
                        </span>
                        {qRes && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              qRes.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {qRes.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selected === optIdx;
                          return (
                            <button
                              key={optIdx}
                              disabled={!!quizResult}
                              onClick={() =>
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                                  : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {qRes && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                          <span className="font-bold text-slate-900">Explanation: </span>
                          {qRes.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!quizResult ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmittingQuiz}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingQuiz ? 'Verifying Answers...' : 'Submit Assessment & Claim XP'}
                </button>
              ) : (
                <div className="pt-2 flex justify-between items-center">
                  <p className="text-xs text-slate-500">{quizResult.feedbackMessage}</p>
                  <button
                    onClick={() => {
                      setQuizResult(null);
                      setSelectedAnswers({});
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">Loading quiz questions...</div>
          )}
        </div>
      )}
    </div>
  );
}
