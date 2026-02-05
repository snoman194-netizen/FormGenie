
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FormStructure, QuestionType } from "../types";

const API_KEY = process.env.API_KEY || '';

export const convertFileToForm = async (
  fileData: string, 
  mimeType: string,
  fileName: string
): Promise<FormStructure> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  let prompt = "";
  let parts: any[] = [];

  if (mimeType === 'text/csv' || fileName.endsWith('.csv')) {
    prompt = `Analyze the provided CSV data to design a Google Form.
    
    CRITICAL INSTRUCTIONS:
    1. Headers: Use the first row as question titles.
    2. Data Patterns: Examine the subsequent rows to determine the best 'type' for each question:
       - MULTIPLE_CHOICE: Use if a column has a small set of repeating values.
       - CHECKBOXES: Use if multiple values apply.
       - DROPDOWN: For larger sets of unique options.
       - SHORT_ANSWER: For brief text.
       - PARAGRAPH: For long text.
    3. Metadata: Note formats like dates/emails in helpText.
    4. Required: Infer if essential.

    CSV Data:
    ${fileData}
    
    Return the result in JSON format following the responseSchema.`;
    parts = [{ text: prompt }];
  } else if (mimeType === 'application/pdf') {
    prompt = `Analyze the content of this PDF and extract relevant information to build a Google Form. 
    Identify surveys, registration forms, or questionnaires within the text.
    Return the result in JSON format following the responseSchema.`;
    parts = [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: fileData.split(',')[1] || fileData
        }
      },
      { text: prompt }
    ];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                type: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                required: { type: Type.BOOLEAN },
                helpText: { type: Type.STRING }
              },
              required: ["id", "title", "type", "required"]
            }
          }
        },
        required: ["title", "description", "questions"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (error) {
    throw new Error("Could not structure form data correctly.");
  }
};

export const processDocToQuestionnaire = async (
  message: string,
  history: any[],
  fileData?: { data: string, mimeType: string }
): Promise<{ text: string, questionnaire?: FormStructure }> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const parts: any[] = [];
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data.split(',')[1] || fileData.data
      }
    });
  }
  parts.push({ text: message });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: `You are an expert Document-to-Questionnaire analyst. 
      Your goal is to extract structured survey/questionnaire data from documents.
      Always respond conversationally, BUT if you identify questions, also provide a hidden JSON structure at the end of your message delimited by [JSON_START] and [JSON_END].
      The JSON must follow the FormStructure schema: {title, description, questions: [{id, title, type, options, required, helpText}]}.
      Question types must be SHORT_ANSWER, PARAGRAPH, MULTIPLE_CHOICE, CHECKBOXES, or DROPDOWN.`,
    }
  });

  const fullText = response.text || "";
  const jsonMatch = fullText.match(/\[JSON_START\]([\s\S]*?)\[JSON_END\]/);
  let questionnaire: FormStructure | undefined;

  if (jsonMatch) {
    try {
      questionnaire = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse extracted JSON", e);
    }
  }

  return {
    text: fullText.replace(/\[JSON_START\][\s\S]*?\[JSON_END\]/, "").trim(),
    questionnaire
  };
};

export const chatWithAssistant = async (message: string, history: any[]) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: 'You are FormGenie Assistant. You specialize in converting data (CSV/PDF) into Google Forms.',
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
