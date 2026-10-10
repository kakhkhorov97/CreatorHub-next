# CreatorHub assistant retrieval

The assistant uses Gemini's `generateContent` API on the Next.js server. This is retrieval-augmented generation (RAG), not model training or fine-tuning.

For each visitor message, the server chooses up to three relevant public help entries from `libs/server/assistant-knowledge.cjs`. For public discovery and current content questions it also makes an anonymous GraphQL request to the CreatorHub backend for current public creator, project, and service matches, site copy, event listings, and category names. The server includes relevant results in Gemini's instruction context and returns only links derived from approved website paths or real public records. A failed backend request leaves the public help entries available and tells Gemini that live data is unavailable. No account bearer token, inquiry, message, saved list, or admin record is sent to Gemini.

The knowledge entries are short, manually reviewed descriptions of implemented website behavior. Update them when the linked Help, About, Contact, or workflow pages change. Do not ingest internal project notes, private documents, database dumps, or user conversations into this source. Event details and site copy are retrieved at request time; they do not require re-training or a manual re-index.

## Local setup

1. Create a Gemini API key in Google AI Studio. Keep it private and out of Git.
2. In the frontend's ignored `.env.local`, set `GEMINI_API_KEY` and `GEMINI_MODEL` to a `generateContent` model available to the key. Google's current model list includes `gemini-3.8-flash`, but model access and pricing depend on the account.
3. Set `NEXT_PUBLIC_API_GRAPHQL_URL` to the running CreatorHub API, then restart the frontend. The browser calls `/api/chat`; the Gemini key never goes into a `NEXT_PUBLIC_` variable.
4. Test a Help question and a creator or event search. The response should include relevant source links. A missing key or model returns a setup message rather than a fabricated answer.

The implementation limits message size, conversation history, response length, per-IP bursts, and a per-process daily quota. A multi-instance deployment needs a shared rate-limit store. The assistant does not execute account actions. Its answers may still be incomplete, so linked records remain the source for current availability and prices.

## Verification

`node --test tests/chat.test.cjs` covers topic retrieval, public-only GraphQL context, secret handling, absent configuration, and request limits. `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` validate the frontend. A guest upload question received a live Gemini answer locally on 8 October 2026. Simple workflow-help questions skip the database request. Public lookup has a 3.5-second deadline; a 503 provider response gets one retry within a shared 25-second deadline. Status-specific errors preserve the question in the input. Signed-in greetings and avatars are rendered locally; account identity is not added to the Gemini prompt.
