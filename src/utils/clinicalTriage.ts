/**
 * Clinical First-Aid Rulebook Engine
 * Strictly adheres to the rapid triage specification under 100 words.
 *
 * CRITICAL INGESTION RULES:
 * - Step 1: State EXACTLY what injury is seen (e.g. "Scraped knee", "Minor cut", "Thermal burn").
 * - Step 2: NEVER assume an insect sting unless explicitly "bee", "wasp", or "sting".
 * - Step 3: Strictly under 100 words.
 *
 * OUTPUT FORMAT:
 * Injury Identified: [State what you see]
 * Urgency: [Home Care Suitable / Consult Doctor / Emergency]
 *
 * First-Aid Steps:
 * 1. [Step 1]
 * 2. [Step 2]
 * 3. [What NOT to do]
 *
 * Red Flags: [When to go to ER]
 */

export interface ClinicalTriageResult {
  urgencyLevel: 'Emergency' | 'Consult Doctor' | 'Home Care Suitable';
  rawMarkdown: string;
}

export function generateClinicalTriage(
  text: string,
  hasImage: boolean = false
): ClinicalTriageResult {
  const lower = (text || '').trim().toLowerCase();

  // 1. EMERGENCY: Severe bleeding, breathing, severe burn, unconsciousness
  const isSevereBleeding =
    lower.includes('spurting') ||
    lower.includes('pulsing') ||
    lower.includes('soaking through') ||
    lower.includes('arterial') ||
    lower.includes('heavy bleeding') ||
    lower.includes("won't stop bleeding");

  const isSevereHeadOrConcussion =
    lower.includes('unconscious') ||
    lower.includes('passed out') ||
    lower.includes('loss of consciousness') ||
    lower.includes('repeated vomiting');

  const isSevereBurn =
    lower.includes('charred') ||
    lower.includes('blackened') ||
    lower.includes('waxy white') ||
    lower.includes('third degree') ||
    lower.includes('3rd degree') ||
    lower.includes('electrical burn') ||
    lower.includes('chemical burn');

  const isBreathingEmergency =
    lower.includes('choking') ||
    lower.includes('cannot breathe') ||
    lower.includes('difficulty breathing') ||
    lower.includes('throat closing');

  if (isSevereBleeding || isSevereHeadOrConcussion || isSevereBurn || isBreathingEmergency) {
    let injury = 'Severe Bleeding Laceration';
    let step1 = 'Call 911 immediately and put phone on speaker.';
    let step2 = 'Apply firm, continuous direct pressure with sterile gauze or clean cloth.';
    let step3 = 'Do NOT lift the cloth to check or remove impaled objects.';
    let redFlags = 'Uncontrolled bleeding after 10 min, loss of consciousness, cold clammy skin, or shock.';

    if (isSevereHeadOrConcussion) {
      injury = 'Severe Head Trauma';
      step1 = 'Call 911 immediately. Keep neck and spine completely still.';
      step2 = 'If vomiting occurs, gently roll person onto side as one unit.';
      step3 = 'Do NOT move or shake the person or press on skull fractures.';
      redFlags = 'Unequal pupils, fluid from ears, repeated vomiting, or loss of responsiveness.';
    } else if (isSevereBurn) {
      injury = 'Severe 3rd-Degree Burn';
      step1 = 'Call 911 immediately for emergency trauma care.';
      step2 = 'Cover loosely with clean, dry, sterile non-stick cloth or plastic wrap.';
      step3 = 'Do NOT apply ice, cold water, ointments, or pull stuck clothing.';
      redFlags = 'Charred skin, difficulty breathing, burns on face or major joints.';
    } else if (isBreathingEmergency) {
      injury = 'Airway Obstruction / Breathing Emergency';
      step1 = 'Call 911 immediately. Encourage coughing if conscious.';
      step2 = 'Give 5 back blows followed by 5 abdominal thrusts (Heimlich).';
      step3 = 'Do NOT perform blind finger sweeps or give fluids.';
      redFlags = 'Inability to speak, blue lips, gasping, or collapse (start CPR).';
    }

    const rawMarkdown = `Injury Identified: ${injury}
Urgency: Emergency

First-Aid Steps:
1. ${step1}
2. ${step2}
3. ${step3}

Red Flags: ${redFlags}`;

    return { urgencyLevel: 'Emergency', rawMarkdown };
  }

  // 2. CONSULT DOCTOR: Deep cuts, second degree burns, animal bites, severe sprains
  const isDeepCut =
    lower.includes('deep cut') ||
    lower.includes('gaping') ||
    lower.includes('stitches') ||
    lower.includes('glass cut') ||
    lower.includes('rusty') ||
    lower.includes('puncture');

  const isModerateBurn =
    lower.includes('blister') ||
    lower.includes('scald') ||
    lower.includes('boiling water') ||
    lower.includes('hot oil') ||
    lower.includes('second degree') ||
    lower.includes('2nd degree');

  const isBite =
    lower.includes('dog bite') ||
    lower.includes('cat bite') ||
    lower.includes('animal bite') ||
    lower.includes('human bite');

  if (isDeepCut || isModerateBurn || isBite) {
    let injury = 'Deep Cut / Laceration';
    let step1 = 'Press firmly with sterile gauze for 10 minutes without peeking.';
    let step2 = 'Gently rinse with cool water and cover with sterile dressing.';
    let step3 = 'Do NOT use harsh alcohol or delay stitches past 8 hours.';
    let redFlags = 'Bleeding won’t stop after 10 min, gaping wound margins, numbness, or fever.';

    if (isModerateBurn) {
      injury = 'Blistering Thermal Burn';
      step1 = 'Run cool, gentle tap water over burn for 15-20 minutes.';
      step2 = 'Cover loosely with sterile non-stick bandage or plastic wrap.';
      step3 = 'Do NOT pop blisters, use ice, or apply butter.';
      redFlags = 'Burn larger than 3 inches, involving face or joints, or spreading redness.';
    } else if (isBite) {
      injury = 'Animal Bite Wound';
      step1 = 'Wash vigorously with mild soap and warm water for 5 minutes.';
      step2 = 'Apply sterile bandage and seek medical evaluation within 6 hours.';
      step3 = 'Do NOT close tightly with tape (high infection risk).';
      redFlags = 'Pus, rapid red streaks, swelling, or unknown animal rabies status.';
    }

    const rawMarkdown = `Injury Identified: ${injury}
Urgency: Consult Doctor

First-Aid Steps:
1. ${step1}
2. ${step2}
3. ${step3}

Red Flags: ${redFlags}`;

    return { urgencyLevel: 'Consult Doctor', rawMarkdown };
  }

  // 3. HOME CARE SUITABLE (Rule 2: NEVER assume insect sting unless text explicitly mentions "bee", "wasp", or "sting")
  const isExplicitSting =
    lower.includes('bee') ||
    lower.includes('wasp') ||
    lower.includes('hornet') ||
    lower.includes('sting');

  if (isExplicitSting) {
    const rawMarkdown = `Injury Identified: Insect Sting
Urgency: Home Care Suitable

First-Aid Steps:
1. Scrape stinger off with a fingernail or card edge; wash with soap and water.
2. Apply an ice pack wrapped in cloth for 10-15 minutes to reduce swelling.
3. Do NOT pinch stinger with tweezers or scratch the area.

Red Flags: Swelling of lips/tongue, difficulty breathing, widespread hives (Call 911 immediately for anaphylaxis).`;

    return { urgencyLevel: 'Home Care Suitable', rawMarkdown };
  }

  if (lower.includes('burn') || lower.includes('sunburn')) {
    const rawMarkdown = `Injury Identified: Minor Superficial Burn
Urgency: Home Care Suitable

First-Aid Steps:
1. Run cool (not icy) tap water over the area for 10-15 minutes.
2. Apply pure aloe vera gel and protect with loose gauze if needed.
3. Do NOT apply ice directly, butter, oil, or pop skin blisters.

Red Flags: Blistering spreads, intense throbbing pain, pus formation, or fever above 100.4°F.`;

    return { urgencyLevel: 'Home Care Suitable', rawMarkdown };
  }

  if (lower.includes('sprain') || lower.includes('ankle') || lower.includes('twisted')) {
    const rawMarkdown = `Injury Identified: Mild Sprain / Strain
Urgency: Home Care Suitable

First-Aid Steps:
1. Rest the limb and apply a towel-wrapped ice pack for 15-20 minutes.
2. Wrap lightly with an elastic bandage and elevate above heart level.
3. Do NOT apply ice directly to bare skin or bear full weight if painful.

Red Flags: Inability to bear any weight, bone deformity, severe bruising, or numbness.`;

    return { urgencyLevel: 'Home Care Suitable', rawMarkdown };
  }

  // Default: Cut or Scrape (Never assume insect sting!)
  const injuryName = lower.includes('scrape') || lower.includes('abrasion') || lower.includes('knee')
    ? 'Scraped Skin (Abrasion)'
    : 'Minor Cut / Scrape';

  const rawMarkdown = `Injury Identified: ${injuryName}
Urgency: Home Care Suitable

First-Aid Steps:
1. Clean gently under cool running tap water to remove dirt; pat dry.
2. Apply gentle pressure if bleeding, then apply Vaseline and a sterile bandage.
3. Do NOT pick at scabs, use harsh rubbing alcohol, or apply dirty dressings.

Red Flags: Spreading red streaks, throbbing pain, yellow pus, or bleeding won't stop after 10 min.`;

  return { urgencyLevel: 'Home Care Suitable', rawMarkdown };
}
