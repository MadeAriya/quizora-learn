/**
 * Robust JSON parser — replicated from n8n Code nodes
 * Handles malformed AI output with multiple parsing strategies
 */
export function parseAIJson(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('AI output is empty or not a string');
  }

  // 1. Clean control characters and whitespace
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/\r?\n/g, ' ');
  cleaned = cleaned.replace(/\t/g, ' ');
  cleaned = cleaned.replace(/[\u0000-\u001F]+/g, '');
  cleaned = cleaned.replace(/,\s*]/g, ']');    // trailing comma in array
  cleaned = cleaned.replace(/,\s*}/g, '}');    // trailing comma in object

  // 2. Extract JSON block between { and }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  // 3. Try parsing
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // 4. Try double-parse (sometimes AI double-escapes)
    try {
      return JSON.parse(JSON.parse(cleaned));
    } catch (err2) {
      throw new Error(`Failed to parse AI JSON: ${err1.message}\nRaw (first 500 chars): ${cleaned.slice(0, 500)}`);
    }
  }
}

/**
 * Normalize questions from object-keyed format to array
 * n8n workflows use { "1": {...}, "2": {...} } but we need arrays
 */
export function normalizeQuestions(parsed) {
  let questionsArray = [];
  if (parsed.questions && typeof parsed.questions === 'object') {
    if (Array.isArray(parsed.questions)) {
      questionsArray = parsed.questions;
    } else {
      questionsArray = Object.values(parsed.questions);
    }
  }
  return questionsArray;
}

/**
 * Clean MCQ choices — remove newlines, fix escaping
 */
export function cleanChoices(questions) {
  return questions.map(q => {
    if (q.choices && Array.isArray(q.choices)) {
      q.choices = q.choices.map(choice =>
        choice.replace(/[\r\n]+/g, ' ').trim()
      );
    }
    return q;
  });
}
