import api from './api';

export interface LineExplanation {
  lineRange: string;
  codeSnippet: string;
  explanation: string;
  role: string;
}

export interface ComplexityAnalysis {
  timeComplexity: string;
  timeExplanation: string;
  spaceComplexity: string;
  spaceExplanation: string;
  bottlenecks: string[];
}

export interface BugReport {
  hasBugs: boolean;
  bugType: string;
  bugDescription: string;
  fixedCode: string;
  fixExplanation: string;
}

export interface PracticeChallenge {
  title: string;
  prompt: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hint: string;
}

export interface ExplainCodeResponse {
  title: string;
  language: string;
  highLevelSummary: string;
  complexity: ComplexityAnalysis;
  lineExplanations: LineExplanation[];
  bugReport: BugReport;
  practiceChallenges: PracticeChallenge[];
}

export interface ExplainCodeRequest {
  code: string;
  language?: string;
  detailLevel?: 'step_by_step' | 'concise' | 'exam_ready';
  goal?: 'explain_and_debug' | 'complexity_only' | 'find_bugs';
}

export const codeService = {
  async explainCode(data: ExplainCodeRequest): Promise<ExplainCodeResponse> {
    const res = await api.post<ExplainCodeResponse>('/api/code/explain', data);
    return res.data;
  }
};
