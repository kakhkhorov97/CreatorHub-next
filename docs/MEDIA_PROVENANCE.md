# Media provenance

CreatorHub includes fictional demo creators, portfolio concepts and events. Demo portraits and concept artwork are AI-generated illustrations of the platform. They do not identify real clients, commissions, venues or scheduled events.

## Bundled assets

The backend stores and serves the demo artwork in `public/demo-media/`. Its build copies those files into the compiled API directory. The frontend forwards `/demo-media/` requests to the backend. Keep these assets when deploying, because stored demo records reference them.

`docs/portrait-assets.json` maps fictional portrait slugs to their assets and records generation prompts. These records describe demo image provenance, not application code generation.

`public/brand/auth-studio.jpg` and `public/brand/discovery-pattern.png` provide the authentication artwork and discovery background. They are website assets rather than development screenshots.

## Introduction video

The project owner reports creating the introduction video at `public/videos/creatorhub-introduction.mp4` using AI. The poster is a frame extracted from that video. The generation provider and its distribution terms have not been recorded.

## User uploads

Creator uploads are separate from bundled demo assets. Keep uploaded files and private media outside Git and store them in the backend's persistent upload directory.


## Fictional homepage hero frames, 13 October 2026

All eight source files (kept privately in `.local/hero-frames-source/`, not published) are original AI-generated fictional background media made with the built-in image generation tool. They depict imagined independent creative studios in Korea. No existing CreatorHub asset was used as a reference. On 13 October 2026 they were combined into the approved 32-second looping homepage hero video (`creatorhub-hero.mp4` / `.webm` with `creatorhub-hero-poster.jpg`, currently in `.local/video-preview/`; not yet placed on a page). The image generator returned 1672 × 941 landscape PNGs, the largest available output in this run; final files are high-quality JPEG conversions without cropping.

Each prompt is transcribed below as submitted.

### hero-01-print-studio.jpg

```text
Use case: photorealistic-natural.
Asset type: first frame in an eight-image series for a slow-looping desktop homepage hero video, 16:9 landscape, at least 1920×1080 if available. No source images.
Scene: a small independent graphic design studio in Korea. A genuinely used desk seen from a wide, slightly elevated documentary camera angle. Printed poster proofs without any legible marks, blank colour swatches in a Pantone-style fan, cutting mat, metal ruler, paper offcuts. Place the visual detail toward the left and right thirds; keep the central 55% quiet and softly blurred for a white headline and search bar.
Style: real editorial photograph, 35mm lens feel, natural window light from the left, soft shadows, shallow depth of field, subtle film grain, imperfect human arrangement, tactile paper and worn studio surfaces. Mid-to-dark exposure that remains legible under a dark forest-green #0F2E22 overlay of 60–90%.
Colour grade: forest green #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, only tiny touches of lime #CDEB6E; muted and slightly desaturated, warm-neutral whites.
Constraints: no people or faces, no readable text or letters, no logos, no brands, no watermarks, no recognisable place, no real artworks. Avoid glossy rendering, surreal details, perfect symmetry, glowing effects, saturated red, blue or purple. This is frame 1 of a consistent series: natural side light, same warm muted grade and lens feel.
```

### hero-02-editorial-print.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: Editorial and print studio: magazine spreads with abstract, illegible image blocks laid out on a large worktable, crop marks but no readable letters, loosely stacked blank paper and trimming tools. Detail on side thirds.
```

### hero-03-letterpress.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: Typography and letterpress studio: weathered wooden type in partly open drawers along the sides, an inked roller and blank paper sheets. Wooden letterforms can appear as indistinct shapes, absolutely no readable letters or words. Quiet central table.
```

### hero-04-packaging.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: Packaging studio: unbranded boxes, blank labels, amber or pale green unlabeled bottles mid-production on a worn workbench; paper samples and tools at edges, calm central work surface.
```

### hero-05-illustration.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: Illustration studio: open sketchbook with nonfigurative gouache colour studies, brushes, water jar and scattered loose sketches; no recognizable artwork, no written marks. Keep centre of composition quiet.
```

### hero-06-photography.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: Small photography studio, no people: softbox, neutral backdrop paper roll, camera on tripod, natural window light and practical cables. Equipment at left and right, calm soft backdrop through centre.
```

### hero-07-motion-video.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: Motion and video editing desk: monitor off to one side showing abstract muted green and ivory colour footage with no interface text, headphones, editing controller, papers. Centre stays visually quiet.
```

### hero-08-3d-product-design.jpg

```text
Use case: photorealistic-natural. Asset type: frame in one consistent eight-image series for a slow looping desktop homepage background video. Original 16:9 landscape image, at least 1920×1080 when available. Scene set in a small independent creative studio in Korea, without a recognizable real location. Real documentary editorial photography, wide slightly elevated 35mm lens feel, natural side window light, soft shadows, shallow depth of field, subtle film grain, tactile imperfections and gently used surfaces. Mid-to-dark exposure, designed for a dark forest-green #0F2E22 overlay at 60–90% opacity and white text. Central 55% must be calm, softly blurred and uncluttered for the headline/search bar; distribute detail around side thirds. Consistent colour grade across series: forest #1E5741, deep forest #0F2E22, warm ivory #F5F3EC, charcoal #15201A, line beige #DEDAD0, tiny lime #CDEB6E accents; muted slightly desaturated warm-neutral whites. No people, faces, readable text, letters, logos, brand names, watermarks, real artwork or identifiable places. Avoid glossy render appearance, surreal details, perfect symmetry, glow, saturated red/blue/purple. Specific frame: 3D and product design studio: modest clay and resin prototypes in simple organic shapes, unlabeled tablet turned off or showing plain colour, tools on a pale stone table. Quiet centre.
```
