
export enum QuestionType {
  SHORT_ANSWER = 'SHORT_ANSWER',
  PARAGRAPH = 'PARAGRAPH',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CHECKBOXES = 'CHECKBOXES',
  DROPDOWN = 'DROPDOWN',
}

export interface FormQuestion {
  id: string;
  title: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  helpText?: string;
}

export interface FormStructure {
  title: string;
  description: string;
  questions: FormQuestion[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
