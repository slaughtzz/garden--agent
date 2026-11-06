// Server-side agent "brain": the API key stays on the server, never in the browser.
export const maxDuration = 30;

const SYSTEM = `You are Sprout, an autonomous garden-tending agent in a game. You get the garden state for ONE game day. Decide today's actions by calling plan_day exactly once.
World rules:
- Crops (days to ripen, water lost per day in %, season): tomato 9d/14/May-Aug, lettuce 5d/10/Apr-May+Sep-Oct (scorches in heat unless shaded), carrot 7d/8/Apr-Sep, basil 4d/9/May-Aug, pepper 10d/11/Jun-Aug.
- Water loss is multiplied by 1.5 in heat, 0.7 cloudy, 0.4 rain. At 0% a plant wilts and loses health. Rain adds water, so do not water on a rainy day, or when rain is forecast unless water < 25.
- Watering trigger is about 45% water, shifted by the pamper slider (0 save water, 100 pamper) and by "learned" (extra % per crop after it wilted). Watering uses litres, so avoid watering plants above 70%.
- harvest when age >= ripeAt. spray plants with pest=true. feed plants with health < 75 (limited stock). shade lettuce when tomorrow is heat.
- plant only in-season crops in empty beds, at most 3 per day. maxHarvest slider: 0 favours variety, 100 favours high-value crops (pepper, tomato). Obey the standing order text.
Keep "thought" under 160 characters and each "why" under 80 characters.`;

const TOOL = {
  name: 'plan_day',
  description: "Submit today's garden actions with reasons.",
  input_schema: {
    type: 'object',
    properties: {
      thought: { type: 'string' },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            t: { type: 'string', enum: ['harvest', 'water', 'shade', 'spray', 'feed', 'plant'] },
            i: { type: 'integer', description: 'bed index 0-11' },
            k: { type: 'string', enum: ['tomato', 'lettuce', 'carrot', 'basil', 'pepper'], description: 'only for plant' },
            why: { type: 'string' },
          },
          required: ['t', 'i', 'why'],
        },
      },
    },
    required: ['thought', 'actions'],
  },
};

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 503 });
  const state = await req.json();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 800,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: 'plan_day' },
        messages: [{ role: 'user', content: 'Garden state:\n' + JSON.stringify(state) }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return Response.json({ error: j.error?.message || 'API ' + r.status }, { status: 502 });
    const block = j.content?.find((c) => c.type === 'tool_use');
    if (!block) return Response.json({ error: 'no tool call returned' }, { status: 502 });
    return Response.json(block.input);
  } catch (e) {
    return Response.json({ error: e.name === 'AbortError' ? 'timeout' : e.message }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}
