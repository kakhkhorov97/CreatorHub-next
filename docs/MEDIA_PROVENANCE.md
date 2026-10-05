# Media provenance

## Introduction video

The frontend uses `public/videos/creatorhub-introduction.mp4` and `public/videos/creatorhub-poster.png` in HomeSections.tsx. The user supplied `/Users/kakhkhorov/Desktop/CreatorHub related/video.mp4`. The implementation copied that video unchanged and extracted the poster with QuickLook. The handoff did not include an external provider URL or license record; no external source or license is inferred.

## Generated demo artwork

The built-in image-generation tool created the four PNG assets during this task from descriptions inspired by the supplied references. `scripts/style-demo.cjs` maps `morrow-cafe.png`, `kinder-tomorrow.png`, and `blank-wellness.png` into fictional project records and `mina-portrait.png` into a fictional creator account. Files live under the backend `public/demo-media/`. Exact prompts are unavailable after context compaction; they are not reconstructed here. All fourteen fictional demo creators now have separate generated portraits. The original Mina portrait remains in use; the other thirteen portraits were added on 4 October 2026. The style-demo script applies these images after the seed script.

Generated source directory: `/Users/kakhkhorov/.codex/generated_images/01a0e7ae-da5a-7293-923a-04036a1a0f2e/`.

| Installed asset | Generated source |
| --- | --- |
| morrow-cafe.png | exec-1340c167-c2cc-4c2f-9ebe-d9d6d6294b64.png |
| kinder-tomorrow.png | exec-47b9f08f-9162-4981-b119-ce6a139030ba.png |
| blank-wellness.png | exec-2a7ab0ae-317a-4cb2-98f8-9258710b5c59.png |
| mina-portrait.png | exec-8dd70266-de14-4a95-bcaf-36ae38abfddf.png |

The earlier SVG fixtures come from the deterministic artwork function in `scripts/seed-demo.cjs`. They are separate from the generated PNG artwork. Both scripts target the disposable creatorhub_frontend_test database. Production media validation and real portfolio record ownership remain unchanged.

## Reference authority

The user supplied the September 25 CreatorHub screen references and approved their white-and-blue direction. Those screens guide layout and appearance; they are not evidence of real creators, customers, or commissioned work.

## Portrait expansion, 4 October 2026

The built-in image_gen tool generated thirteen separate realistic portraits after the user selected generated portraits of fictional users. Exact prompts, original generated file paths, and installed filenames are recorded in `portrait-assets.json`. These pictures are fictional adults and do not represent real members. Files are installed under the backend `public/demo-media/`. The expansion script assigns portraits, adds six categories and six creator accounts with one active service each, and leaves the integration-only studio-test profile as a draft.

## International portfolio studies, 4 October 2026

Three original photorealistic assets were generated with the built-in image_gen tool for fictional international concepts. They are stored in the backend `public/demo-media/` as lume-lisbon.png, copenhagen-reading-room.png, and frame-tokyo.png. Exact prompts and original source paths are recorded in international-project-assets.json. Each linked project's summary and description identifies the fictional concept and AI-generated artwork. They imply no real client, commission, publication, or building. Existing fictional creators own these concepts; the project setting does not claim that their creator lives in that city.

The user supplied introduction video remains unchanged. Its Korean-language text is part of the approved video asset; surrounding website copy is international.

## Backend delivery, 5 October 2026

At the user's request, all 51 approved demo-media images and SVG studies were copied byte-for-byte into the backend repository at `public/demo-media/`. The backend serves `/demo-media/<filename>`, and its build packages the folder into `dist/apps/Creator-api/public/demo-media/`. The frontend's `beforeFiles` rewrite forwards the same paths to the configured GraphQL API origin. Existing MongoDB avatar and project image URL fields remain unchanged. Local seed scripts use the backend media folder; the frontend has no duplicate media folder. This delivery method has been tested locally, but a remote deployment has not yet been configured or verified.


## Inbox batch portfolio images, 5 October 2026

Seven new image_gen concepts in the backend `public/demo-media/` replace twelve fictional demo SVG covers and matching galleries. Slow Journal, Dayplan, Island Notes, MOVE festival, Bare Essentials, Studio Index and Type Studies are AI-generated portfolio concepts, not real commissions. Source paths and full prompts are in PORTFOLIO_ASSETS_OCT5.json. Updated database records explicitly identify fictional AI artwork.
