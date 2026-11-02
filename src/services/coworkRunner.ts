import { WorkflowTask, WorkflowStep, Artifact } from '../types';
import { gmailService, driveService, sheetsService, calendarService } from './workspaceApi';

export class CoworkEngine {
  // Plan a complex workflow via Node backend
  static async planWorkflow(userPrompt: string, isWorkspaceConnected: boolean): Promise<WorkflowTask> {
    try {
      const res = await fetch('/api/workflow/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          workspaceState: { isWorkspaceConnected },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.plan && data.plan.steps && data.plan.steps.length > 0) {
          const plan = data.plan;
          return {
            id: `task_${Date.now()}`,
            title: plan.taskTitle || 'Autonomous Cowork Task',
            description: plan.taskDescription || userPrompt,
            summary: plan.summary || "I've structured this task into an automated workflow. Let's begin.",
            status: 'running',
            activeStepIndex: 0,
            createdAt: Date.now(),
            steps: plan.steps.map((s: any, idx: number) => ({
              id: s.id || `step_${idx + 1}`,
              title: s.title || `Workflow Step ${idx + 1}`,
              tool: s.tool || 'agent.reason',
              params: s.params || {},
              requiresConfirmation: Boolean(s.requiresConfirmation),
              rationale: s.rationale || '',
              status: idx === 0 ? 'running' : 'pending',
            })),
          };
        }
      }
    } catch (err) {
      console.warn('Backend planning failed, using intelligent rule-based planner', err);
    }

    // High quality intelligent fallback workflow generator
    return this.generateDefaultPlan(userPrompt, isWorkspaceConnected);
  }

  // Intelligent fallback workflow plan generator
  private static generateDefaultPlan(prompt: string, isWorkspaceConnected: boolean): WorkflowTask {
    const lower = prompt.toLowerCase();
    const steps: WorkflowStep[] = [];
    let title = 'Autonomous Cowork Workflow';
    let description = prompt;

    if (lower.includes('email') || lower.includes('inbox') || lower.includes('gmail')) {
      title = 'Inbox Audit & Action Workflow';
      steps.push({
        id: 'step_1',
        title: 'Query and analyze recent emails in Gmail',
        tool: 'gmail.list',
        params: { maxResults: 5, query: 'is:unread OR label:important' },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Inspect user inbox to retrieve context and identify urgent requests',
      });
      steps.push({
        id: 'step_2',
        title: 'Synthesize executive inbox summary & action items',
        tool: 'artifact.create',
        params: {
          title: 'Executive Inbox Briefing',
          type: 'report',
        },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Prepare a consolidated Cowork Briefing card for review',
      });
      if (lower.includes('send') || lower.includes('reply') || lower.includes('draft')) {
        steps.push({
          id: 'step_3',
          title: 'Draft / Send coordinated email update',
          tool: 'gmail.send',
          params: { to: 'colleague@example.com', subject: 'Summary & Next Steps', body: 'Executive summary prepared by Jarvis Cowork AI.' },
          requiresConfirmation: true,
          status: 'pending',
          rationale: 'User approval is strictly required before sending emails on their behalf',
        });
      }
    } else if (lower.includes('sheet') || lower.includes('spreadsheet') || lower.includes('data') || lower.includes('csv')) {
      title = 'Data Pipeline & Google Sheets Sync';
      steps.push({
        id: 'step_1',
        title: 'Search live market / industry data via Web Search',
        tool: 'browser.search',
        params: { query: prompt },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Collect verified facts, pricing, or metrics from search grounding',
      });
      steps.push({
        id: 'step_2',
        title: 'Create or update Google Spreadsheet with structured data',
        tool: 'sheets.create',
        params: {
          title: `Jarvis Analysis - ${new Date().toLocaleDateString()}`,
          headers: ['Metric / Entity', 'Status / Value', 'Source', 'Recorded Date'],
        },
        requiresConfirmation: true,
        status: 'pending',
        rationale: 'Mutating Google Sheets requires explicit user confirmation',
      });
      steps.push({
        id: 'step_3',
        title: 'Generate structured Cowork Data Artifact',
        tool: 'artifact.create',
        params: {
          title: 'Structured Spreadsheet Report',
          type: 'table',
        },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Display clean tabular presentation in the Claude Cowork canvas',
      });
    } else if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('meeting')) {
      title = 'Calendar Scheduling & Schedule Optimization';
      steps.push({
        id: 'step_1',
        title: 'Check upcoming events in Google Calendar',
        tool: 'calendar.list',
        params: { maxResults: 10 },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Check schedule density and identify free slots',
      });
      steps.push({
        id: 'step_2',
        title: 'Schedule targeted calendar event',
        tool: 'calendar.create',
        params: {
          summary: 'Project Review & Working Session',
          description: 'Organized autonomously via Jarvis Cowork',
          startDateTime: new Date(Date.now() + 3600000 * 24).toISOString(),
          endDateTime: new Date(Date.now() + 3600000 * 25).toISOString(),
        },
        requiresConfirmation: true,
        status: 'pending',
        rationale: 'Calendar event creation requires explicit confirmation',
      });
      steps.push({
        id: 'step_3',
        title: 'Generate Cowork Schedule Briefing',
        tool: 'artifact.create',
        params: {
          title: 'Optimized Agenda & Next Steps',
          type: 'action_plan',
        },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Deliver polished agenda document artifact',
      });
    } else {
      // General multi-step research + workspace execution
      title = 'Deep Cowork Research & Automated Synthesis';
      steps.push({
        id: 'step_1',
        title: 'Conduct autonomous web research and browser search',
        tool: 'browser.search',
        params: { query: prompt },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Gather live web data and verified citations',
      });
      steps.push({
        id: 'step_2',
        title: 'Synthesize research into an Executive Cowork Artifact',
        tool: 'artifact.create',
        params: {
          title: 'Jarvis Executive Briefing Document',
          type: 'report',
        },
        requiresConfirmation: false,
        status: 'pending',
        rationale: 'Synthesize raw web data into clean, structured Markdown',
      });
      if (isWorkspaceConnected) {
        steps.push({
          id: 'step_3',
          title: 'Archive report to Google Drive',
          tool: 'drive.create',
          params: {
            name: `Jarvis Briefing - ${new Date().toISOString().slice(0, 10)}.md`,
            content: 'Synthesized research and executive insights',
          },
          requiresConfirmation: true,
          status: 'pending',
          rationale: 'Creating file in Google Drive requires user authorization',
        });
      }
    }

    return {
      id: `task_${Date.now()}`,
      title,
      description,
      summary: `I've planned out ${steps.length} sequential steps for "${title}". Commencing execution now.`,
      status: 'running',
      activeStepIndex: 0,
      createdAt: Date.now(),
      steps,
    };
  }

  // Execute a specific tool step
  static async executeStep(
    step: WorkflowStep,
    context: {
      isWorkspaceConnected: boolean;
      userPrompt: string;
      previousOutputs: Record<string, any>;
    }
  ): Promise<{ output: any; artifact?: Artifact }> {
    const { tool, params } = step;

    switch (tool) {
      // GMAIL
      case 'gmail.list': {
        const msgs = await gmailService.listMessages(params.query || '', params.maxResults || 5);
        return {
          output: {
            messageCount: msgs.length,
            messages: msgs,
            summary: `Retrieved ${msgs.length} email threads matching query.`,
          },
        };
      }
      case 'gmail.send': {
        const res = await gmailService.sendEmail(params.to, params.subject, params.body);
        return {
          output: {
            sent: true,
            id: res.id,
            to: params.to,
            subject: params.subject,
          },
        };
      }
      case 'gmail.draft': {
        const res = await gmailService.createDraft(params.to, params.subject, params.body);
        return {
          output: {
            draftCreated: true,
            id: res.id,
            to: params.to,
            subject: params.subject,
          },
        };
      }

      // DRIVE
      case 'drive.list': {
        const files = await driveService.listFiles(params.query || '', params.pageSize || 10);
        return {
          output: {
            fileCount: files.length,
            files,
          },
        };
      }
      case 'drive.create': {
        const res = await driveService.createFile(params.name, params.content, params.mimeType || 'text/plain');
        return {
          output: {
            created: true,
            file: res,
          },
        };
      }

      // SHEETS
      case 'sheets.create': {
        const res = await sheetsService.createSpreadsheet(params.title, params.headers || []);
        return {
          output: {
            created: true,
            spreadsheetId: res.spreadsheetId,
            spreadsheetUrl: res.spreadsheetUrl,
          },
        };
      }
      case 'sheets.append': {
        const res = await sheetsService.appendRow(params.spreadsheetId, params.values, params.range);
        return {
          output: {
            appended: true,
            result: res,
          },
        };
      }
      case 'sheets.read': {
        const values = await sheetsService.getValues(params.spreadsheetId, params.range);
        return {
          output: {
            rowCount: values.length,
            values,
          },
        };
      }

      // CALENDAR
      case 'calendar.list': {
        const events = await calendarService.listEvents(params.timeMin, params.maxResults || 10);
        return {
          output: {
            eventCount: events.length,
            events,
          },
        };
      }
      case 'calendar.create': {
        const res = await calendarService.createEvent(
          params.summary,
          params.startDateTime,
          params.endDateTime,
          params.description,
          params.location
        );
        return {
          output: {
            created: true,
            event: res,
          },
        };
      }

      // BROWSER & WEB SEARCH
      case 'browser.search': {
        const res = await fetch('/api/browser/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: params.query || context.userPrompt }),
        });
        if (!res.ok) {
          throw new Error('Web search request failed');
        }
        const data = await res.json();
        return {
          output: {
            query: data.query,
            content: data.content,
            sources: data.sources || [],
          },
        };
      }

      // ARTIFACT CREATION (Claude Cowork Canvas Document)
      case 'artifact.create': {
        const res = await fetch('/api/artifact/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: context.userPrompt,
            contextData: context.previousOutputs,
            artifactType: params.type || 'report',
          }),
        });

        let content = `# ${params.title || 'Executive Cowork Briefing'}\n\n*Generated by Jarvis Cowork Engine on ${new Date().toLocaleDateString()}*\n\n`;
        if (res.ok) {
          const data = await res.json();
          content = data.content || content;
        } else {
          content += `### Context & Research Findings\n\n${JSON.stringify(context.previousOutputs, null, 2)}`;
        }

        const artifact: Artifact = {
          id: `art_${Date.now()}`,
          title: params.title || 'Cowork Executive Artifact',
          type: params.type || 'report',
          content,
          createdAt: Date.now(),
          metadata: { stepId: step.id, tool: step.tool },
        };

        return {
          output: { artifactCreated: true, artifactId: artifact.id },
          artifact,
        };
      }

      default: {
        return {
          output: { status: 'completed', info: 'Step processed successfully' },
        };
      }
    }
  }
}
