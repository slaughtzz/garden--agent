# Garden Agent (Next.js + AI agent)

Run locally: `npm install`, copy `.env.example` to `.env.local` and add your key, then `npm run dev`.
Deploy: push to GitHub, import in Vercel, add `ANTHROPIC_API_KEY` under Settings, Environment Variables, redeploy.

How the agent works (observe, think, act, learn):
- Observe: the browser builds a snapshot of the garden each game day (`snap()` in `app/page.js`).
- Think: it POSTs the snapshot to `/api/think`, where an LLM is forced to call the `plan_day` tool and returns actions with reasons.
- Act: the page validates each action and runs it (water, feed, shade, spray, harvest, plant), respecting the autonomy setting.
- Learn: when a plant wilts, the watering trigger for that crop is raised.
- Fallback: with no key, or on any error, built-in gardening rules decide (the Brain button switches manually).
