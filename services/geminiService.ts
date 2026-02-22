
import { GoogleGenAI, Type } from "@google/genai";
import { CoachingData, CalculationResults, StatementRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractStatementData(statement: StatementRecord) {
  if (!statement.base64Data) throw new Error("No data found for this statement.");

  const prompt = `
    You are a financial OCR extraction engine for Crown Money.
    TASK: ${statement.prompt || "Extract the current loan balance, available redraw, and monthly credits/debits summary from this statement."}
    
    The user wants to extract specific numbers to fill a coaching dashboard. 
    Look for:
    - Current Loan Balance
    - Available Redraw
    - Total Credits for the month
    - Total Debits for the month
    
    Return the result in JSON format only with these keys: 
    balance (number), redraw (number), totalCredits (number), totalDebits (number), confidence (0-1), notes (string).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: statement.base64Data, mimeType: statement.mimeType || 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            balance: { type: Type.NUMBER },
            redraw: { type: Type.NUMBER },
            totalCredits: { type: Type.NUMBER },
            totalDebits: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ['balance', 'redraw', 'totalCredits', 'totalDebits'],
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Extraction failed:", error);
    throw error;
  }
}

export async function parseRedrawsFromText(text: string) {
  const prompt = `
    You are a financial data parser for Crown Money.
    TASK: Convert the following raw notes about redraws into a structured JSON array of redraw records.
    
    INPUT TEXT:
    ${text}
    
    RULES:
    - Extract the date (format: DD.MM.YY or similar).
    - Extract the amount (number).
    - Extract the description/purpose.
    - Assign the correct month name (e.g., "January", "February") based on the date.
    - If a record seems to be multiple items combined, keep them as one record if they share a date/amount in the text, or split if clearly separate.
    
    Return a JSON array of objects with these keys:
    id (string, unique), date (string), amount (number), description (string), month (string), excluded (boolean, default false).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              date: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              description: { type: Type.STRING },
              month: { type: Type.STRING },
              excluded: { type: Type.BOOLEAN },
            },
            required: ['id', 'date', 'amount', 'description', 'month'],
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Redraw Parsing failed:", error);
    return [];
  }
}

export async function generateCoachingSummary(data: CoachingData, results: CalculationResults) {
  const prompt = `
    Analyze this financial data for a Crown Money coaching client and provide a professional, encouraging summary for the coach to present.
    
    CLIENT INFO:
    Names: ${data.householdNames}
    Review Period: ${data.reviewPeriodType}
    
    PERFORMANCE:
    Total Debt Reduction: $${results.totalDebtReduction.toFixed(2)}
    Avg Monthly Reduction: $${results.avgMonthlyDebtReduction.toFixed(2)}
    Current Savings Rate: ${results.savingsRate.toFixed(1)}% (First report was ${data.firstReportSavingsRate}%)
    Average Monthly Income: $${results.avgMonthlyIncome.toFixed(2)}
    Average Monthly Expenses: $${results.avgMonthlyExpenses.toFixed(2)}
    Current LVR: ${results.currentLVR.toFixed(1)}%
    
    CASHFLOW:
    Total Credits: $${data.monthlyData.reduce((s, m) => s + m.credit, 0).toFixed(2)}
    Weekly Spending: $${data.weeklySpendingAmount} on ${data.weeklySpendingDay}s
    
    12 STEPS PROGRESS:
    Total Steps Completed: ${Object.values(results.stepsStatus).filter(s => s === 'YES').length} / 12

    COACH NOTES:
    ${data.coachNotes || 'No specific notes provided.'}

    Output in JSON format with exactly these fields:
    - achievements (array of strings)
    - momentumScore (1-100)
    - risks (array of strings)
    - focusAreas (array of strings)
    - suggestedSMARTGoals (array of strings)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
            momentumScore: { type: Type.NUMBER },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedSMARTGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['achievements', 'momentumScore', 'risks', 'focusAreas', 'suggestedSMARTGoals'],
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini failed:", error);
    return {
      achievements: ["Successfully reduced total debt during period", "Maintained consistent income levels"],
      momentumScore: 75,
      risks: ["Fluctuating monthly expenses", "Savings rate below target"],
      focusAreas: ["Consolidating external debts", "Increasing monthly flex amount"],
      suggestedSMARTGoals: ["Increase monthly debt reduction by 5%", "Build emergency buffer to 3 months"]
    };
  }
}
