
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FormStructure, QuestionType } from "../types";

const COMPLEX_MODEL = 'gemini-3-pro-preview';
const THINKING_BUDGET = 32768;

export const convertFileToForm = async (
  fileData: string, 
  mimeType: string,
  fileName: string
): Promise<FormStructure> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    model: COMPLEX_MODEL,
    contents: { parts },
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
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

export const refineFormWithAI = async (currentForm: FormStructure, instruction: string): Promise<FormStructure> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Refine the following Google Form structure based on this instruction: "${instruction}".
  
  Current Form:
  ${JSON.stringify(currentForm, null, 2)}
  
  Instructions:
  1. Modify the questions, titles, descriptions, or options as requested.
  2. Ensure the output is a valid FormStructure.
  3. Improve clarity, tone, and professionalism where appropriate.
  4. If adding questions, generate appropriate unique IDs.
  
  Return the result in JSON format following the responseSchema.`;

  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
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
    throw new Error("Failed to refine form with AI.");
  }
};

export const processDocToQuestionnaire = async (
  message: string,
  history: any[],
  fileData?: { data: string, mimeType: string },
  deepThink: boolean = false
): Promise<{ text: string, questionnaire?: FormStructure }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    model: COMPLEX_MODEL,
    contents: { parts },
    config: {
      thinkingConfig: deepThink ? { thinkingBudget: THINKING_BUDGET } : undefined,
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

export const chatWithAssistant = async (message: string, historyPayload: any[], deepThink: boolean = false) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: historyPayload,
    config: {
      thinkingConfig: deepThink ? { thinkingBudget: THINKING_BUDGET } : undefined,
      systemInstruction: `You are FormGenie Assistant. You specialize in converting data (CSV/PDF) into Google Forms AND drafting legal documents based on US state laws.

If the user wants to draft a legal document:
1. Always ask for the Document Type and the specific US State if not provided.
2. Once the type and state are known, start an interactive drafting session.
3. Ask relevant questions ONE BY ONE to gather details for the document (e.g., names of parties, addresses, dates, specific amounts, or unique clauses).
4. CRITICAL: Prefix every question intended to fill a field with "[FIELD_QUERY]". For example: "[FIELD_QUERY] What is the full legal name of the Grantor?"
5. Inform the user they can skip any question they don't have the answer to.
6. Once the user is finished or you have enough info, generate the final document.
7. FOR ALL SKIPPED OR MISSING INFO: Leave the space empty and fill it with exactly "________" (8 underscores).
8. Ensure the document follows standard legal conventions for the chosen state.`,
    }
  });

  return response.text;
};

export const searchLegalDocuments = async (docType: string, state: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Find official and up-to-date legal documents, forms, and files related to "${docType}" for the US state of "${state}". 
  Provide clear descriptions and identify the most reliable sources. 
  Focus on state government websites (.gov) and official judicial resources.`;

  // Explicitly use the Pro model to satisfy the user's intelligence requirements
  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL, 
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      // Search results might benefit from thinking for complex syntheses if needed,
      // but standard grounding usually handles the output.
    },
  });

  return {
    text: response.text,
    groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
  };
};

export const convertSearchContextToForm = async (contextText: string, linkTitle: string, linkUri: string): Promise<FormStructure> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Based on the following legal search context, generate a structured Google Form blueprint that would capture the information typically required for this type of document/application.
  
  Source Title: ${linkTitle}
  Source URL: ${linkUri}
  Analysis Context: ${contextText}
  
  Return the result in JSON format following the responseSchema.`;

  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
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
    throw new Error("Could not structure form from search results.");
  }
};

export const synthesizeDocumentDraft = async (contextText: string, linkTitle: string, linkUri: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Draft a professional and formal legal document or template based on the following search result for "${linkTitle}". 
  Use standard legal formatting (headings, numbered sections, placeholders for personal info like [NAME]).
  
  Analysis Context: ${contextText}
  Source: ${linkUri}
  
  The draft should be complete, professional, and ready for use as a template. Do not include markdown code fences, just return the plain text of the document.`;

  const response = await ai.models.generateContent({
    model: COMPLEX_MODEL,
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: THINKING_BUDGET }
    }
  });

  return response.text || "Failed to generate document draft.";
};
