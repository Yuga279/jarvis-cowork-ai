import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const apiRouter = express.Router();

// Initialize Google Gemini API on server side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }
  return new GoogleGenAI({ apiKey });
};

// Health and config status
apiRouter.get('/health', (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey,
    timestamp: new Date().toISOString(),
  });
});

// Autonomous Workflow Planner (Claude Cowork Planner Engine)
apiRouter.post('/workflow/plan', async (req: Request, res: Response) => {
  try {
    const { userPrompt, workspaceState } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: 'userPrompt is required' });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are Jarvis, an elite autonomous executive AI coworker inspired by Claude Cowork and Marvel's Jarvis.
The user wants to execute a multi-step task involving Google Workspace (Gmail, Calendar, Drive, Sheets), Web Search / Browser Use, and Artifact generation.

Break down the user's request into an actionable sequence of workflow steps.
Available tool identifiers:
- "gmail.list": List/search emails. Params: { query?: string, maxResults?: number }
- "gmail.draft": Create an email draft. Params: { to: string, subject: string, body: string }
- "gmail.send": Send an email (requiresConfirmation: true). Params: { to: string, subject: string, body: string }
- "calendar.list": List calendar events. Params: { timeMin?: string, maxResults?: number }
- "calendar.create": Create a calendar event (requiresConfirmation: true). Params: { summary: string, description?: string, startDateTime: string, endDateTime: string }
- "drive.list": Search or list files in Google Drive. Params: { query?: string, pageSize?: number }
- "drive.create": Create a text/doc file in Drive (requiresConfirmation: true). Params: { name: string, content: string, mimeType?: string }
- "sheets.create": Create a new Google Spreadsheet. Params: { title: string, headers?: string[] }
- "sheets.append": Append rows to a sheet (requiresConfirmation: true). Params: { spreadsheetId: string, values: string[][] }
- "sheets.read": Read rows from a sheet. Params: { spreadsheetId: string, range?: string }
- "browser.search": Search the web for live information. Params: { query: string }
- "browser.fetch": Fetch and summarize web research page. Params: { url: string, topic?: string }
- "artifact.create": Produce a rich Markdown/Executive Cowork Report. Params: { title: string, type: "report" | "table" | "action_plan" | "summary", content: string }

Workspace connection status provided by client:
${JSON.stringify(workspaceState || {})}

Return a valid JSON object matching this schema:
{
  "taskTitle": "Short punchy name for the workflow",
  "taskDescription": "Clear summary of what Jarvis will accomplish",
  "summary": "Jarvis spoken response to acknowledge the user command",
  "steps": [
    {
      "id": "step_1",
      "title": "Clear step title",
      "tool": "one of the available tool identifiers above",
      "params": { ... parameters for the tool ... },
      "requiresConfirmation": boolean (true for send, create calendar, update sheets),
      "rationale": "Why this step is necessary"
    }
  ]
}

CRITICAL: Return ONLY valid JSON, with no markdown code blocks or surrounding text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const plan = JSON.parse(text);
    return res.json({ success: true, plan });
  } catch (err: any) {
    console.error('Error in /workflow/plan:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate workflow plan',
    });
  }
});

// Autonomous Step Synthesizer & Browser Research Executor
apiRouter.post('/browser/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const ai = getGeminiClient();

    // Use Gemini with Google Search tool enabled to fetch live, real-world information
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Search the web and provide detailed, up-to-date, factual research findings for: "${query}".
Include key bullet points, sources/urls if known, actionable data points, and an executive briefing section suitable for automated workflows.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const searchChunks = groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks.map((chunk: any) => ({
      title: chunk.web?.title || 'Web Reference',
      url: chunk.web?.uri || '#',
    }));

    return res.json({
      success: true,
      query,
      content: response.text || 'No research results generated.',
      sources: webSources,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in /browser/search:', err);
    return res.status(500).json({
      error: err.message || 'Web research search failed',
    });
  }
});

// Content / Artifact Synthesis for Cowork Canvas
apiRouter.post('/artifact/synthesize', async (req: Request, res: Response) => {
  try {
    const { prompt, contextData, artifactType } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are Jarvis Cowork Artifact Synthesizer.
Produce a comprehensive, production-ready document artifact based on the provided context data.
Artifact type requested: ${artifactType || 'report'}.
Format cleanly in GitHub-flavored Markdown with bold sections, tables, metrics, and actionable executive summaries.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Request: ${prompt}\n\nContext Data:\n${JSON.stringify(contextData || {})}`,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      success: true,
      content: response.text,
    });
  } catch (err: any) {
    console.error('Error in /artifact/synthesize:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize artifact',
    });
  }
});

// Advanced Data Intelligence & Auto-Visualization Recommender
apiRouter.post('/data/analyze', async (req: Request, res: Response) => {
  try {
    const { datasetName, sampleRows, columns, totalRows } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are Jarvis Data Intelligence Engine.
Analyze the provided dataset structure and sample rows.
Return a valid JSON object matching this schema:
{
  "summary": "2-3 sentence executive synopsis of what the data shows",
  "recommendedChart": "bar" | "line" | "area" | "pie" | "composed",
  "categoryColumn": "best column name for X-axis",
  "valueColumns": ["array of best numeric column names for Y-axes"],
  "keyMetrics": [
    { "label": "e.g. Total Revenue", "value": "e.g. $4.8M", "trend": "+18.4%", "status": "positive" | "neutral" | "negative" }
  ],
  "insights": [
    "Insight bullet 1 describing key pattern or top performer",
    "Insight bullet 2 describing anomaly, growth area, or bottleneck",
    "Insight bullet 3 actionable recommendation for executive action"
  ]
}

Return ONLY raw JSON, with no enclosing markdown or code fences.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Dataset: ${datasetName || 'User Data'}\nColumns: ${JSON.stringify(columns)}\nSample Rows (Total: ${totalRows}):\n${JSON.stringify(sampleRows || [])}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const analysis = JSON.parse(response.text || '{}');
    return res.json({ success: true, analysis });
  } catch (err: any) {
    console.error('Error in /data/analyze:', err);
    return res.status(500).json({
      error: err.message || 'Failed to analyze dataset',
    });
  }
});
