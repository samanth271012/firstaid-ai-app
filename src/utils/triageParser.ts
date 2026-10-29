import { ParsedTriage, UrgencyLevel } from '../types/firstaid';

export function parseTriageMarkdown(text: string): ParsedTriage {
  let injuryIdentified = '';
  let urgencyLevel: UrgencyLevel = 'Home Care Suitable';
  let assessmentSummary = '';
  const immediateSteps: string[] = [];
  const whatNotToDo: string[] = [];
  const redFlags: string[] = [];
  let disclaimer = 'I am an AI assistant, not a doctor. This information is for general first-aid guidance and does not replace professional medical evaluation.';

  // 1. Extract "Injury Identified:"
  const injuryMatch = text.match(/(?:Injury Identified|Injury Visible|Identified Injury|Injury):\s*([^\n\r]+)/i);
  if (injuryMatch && injuryMatch[1]) {
    injuryIdentified = injuryMatch[1].trim();
  }

  // 2. Extract "Urgency:" or "URGENCY LEVEL:"
  const urgencyMatch = text.match(/(?:🚨\s*)?(?:URGENCY LEVEL|Urgency):\s*([^\n\r]+)/i);
  if (urgencyMatch && urgencyMatch[1]) {
    const rawLevel = urgencyMatch[1].trim().toLowerCase();
    if (rawLevel.includes('emergency')) {
      urgencyLevel = 'Emergency';
    } else if (rawLevel.includes('consult doctor soon') || rawLevel.includes('doctor soon')) {
      urgencyLevel = 'Consult Doctor Soon';
    } else if (rawLevel.includes('consult doctor') || rawLevel.includes('consult')) {
      urgencyLevel = 'Consult Doctor';
    } else if (rawLevel.includes('home care') || rawLevel.includes('home')) {
      urgencyLevel = 'Home Care Suitable';
    }
  }

  // 3. Extract "ASSESSMENT SUMMARY:" if present
  const assessmentRegex = /(?:🔍\s*)?ASSESSMENT SUMMARY:\s*([\s\S]*?)(?=(?:⚡\s*)?(?:IMMEDIATE FIRST-AID STEPS|First-Aid Steps):|$)/i;
  const assessmentMatch = text.match(assessmentRegex);
  if (assessmentMatch && assessmentMatch[1]) {
    assessmentSummary = assessmentMatch[1].trim();
  } else if (injuryIdentified) {
    assessmentSummary = `Injury Identified: ${injuryIdentified}`;
  }

  // 4. Extract "First-Aid Steps:" or "IMMEDIATE FIRST-AID STEPS:"
  const stepsRegex = /(?:⚡\s*)?(?:IMMEDIATE FIRST-AID STEPS|First-Aid Steps|First Aid Steps):\s*([\s\S]*?)(?=(?:⚠️\s*)?(?:RED FLAGS|Red Flags):|$)/i;
  const stepsMatch = text.match(stepsRegex);
  if (stepsMatch && stepsMatch[1]) {
    const stepsBlock = stepsMatch[1].trim();
    const lines = stepsBlock.split('\n');

    let isWhatNotToDoSection = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check if this line introduces "what NOT to do"
      if (
        line.toLowerCase().includes('what not to do') ||
        line.toLowerCase().includes('do not:') ||
        line.toLowerCase().includes('avoid:')
      ) {
        isWhatNotToDoSection = true;
        const parts = line.split(/:\s*/);
        if (parts.length > 1 && parts[1].trim()) {
          whatNotToDo.push(cleanStepText(parts[1]));
        }
        continue;
      }

      const cleaned = cleanStepText(line);
      if (!cleaned) continue;

      if (isWhatNotToDoSection) {
        whatNotToDo.push(cleaned);
      } else {
        // In the new format, Step 3 is often "[What NOT to do]" or starts with "Do not"
        if (
          /^(?:do not|don't|never|avoid|what not to do)\b/i.test(cleaned) ||
          cleaned.toLowerCase().startsWith('do not') ||
          cleaned.toLowerCase().startsWith("don't")
        ) {
          whatNotToDo.push(cleaned);
        } else {
          immediateSteps.push(cleaned);
        }
      }
    }
  }

  // 5. Extract "Red Flags: [When to go to ER]"
  const redFlagsRegex = /(?:⚠️\s*)?(?:RED FLAGS|Red Flags)[^\n:]*:\s*([\s\S]*?)(?=(?:⚖️\s*)?(?:MEDICAL DISCLAIMER|Medical Disclaimer):|$)/i;
  const redFlagsMatch = text.match(redFlagsRegex);
  if (redFlagsMatch && redFlagsMatch[1]) {
    const flagsBlock = redFlagsMatch[1].trim();
    const lines = flagsBlock.split('\n');
    for (const rawLine of lines) {
      const cleaned = cleanStepText(rawLine);
      if (cleaned) {
        redFlags.push(cleaned);
      }
    }
  }

  // 6. Extract Disclaimer if present
  const disclaimerRegex = /(?:⚖️\s*)?(?:MEDICAL DISCLAIMER|Medical Disclaimer):\s*([\s\S]*?)$/i;
  const disclaimerMatch = text.match(disclaimerRegex);
  if (disclaimerMatch && disclaimerMatch[1]) {
    const disc = disclaimerMatch[1].trim();
    if (disc) {
      disclaimer = disc;
    }
  }

  // Fallbacks
  if (immediateSteps.length === 0 && text.trim()) {
    immediateSteps.push('Clean gently, protect the area, and seek medical attention if needed.');
  }

  return {
    injuryIdentified: injuryIdentified || undefined,
    urgencyLevel,
    assessmentSummary,
    immediateSteps,
    whatNotToDo,
    redFlags,
    disclaimer,
    rawMarkdown: text,
  };
}

function cleanStepText(text: string): string {
  return text
    .replace(/^(\d+[\.\)]\s*)/, '') // Remove numbers like "1. " or "1) "
    .replace(/^[\*\-\•\–]\s*/, '') // Remove bullet characters
    .replace(/^\[|\]$/g, '') // Remove surrounding brackets like "[Clean wound]"
    .replace(/^["'`]|["'`]$/g, '') // Remove surrounding quotes
    .trim();
}
