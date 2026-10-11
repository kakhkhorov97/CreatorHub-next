# Media provenance

CreatorHub includes fictional demo creators, portfolio concepts and events. Demo portraits and concept artwork are AI-generated illustrations of the platform. They do not identify real clients, commissions, venues or scheduled events.

## Bundled assets

The backend stores and serves the demo artwork in `public/demo-media/`. Its build copies those files into the compiled API directory. The frontend forwards `/demo-media/` requests to the backend. Keep these assets when deploying, because stored demo records reference them.

`docs/portrait-assets.json` maps fictional portrait slugs to their assets and records generation prompts. These records describe demo image provenance, not application code generation.

`public/brand/auth-studio.jpg` and `public/brand/discovery-pattern.png` provide the authentication artwork and discovery background. They are website assets rather than development screenshots.

## Introduction video

The project owner supplied the introduction video included at `public/videos/creatorhub-introduction.mp4`. The poster is a frame extracted from that video. No external source or distribution license was supplied with it. Confirm publication rights before publishing the repository and website.

## User uploads

Creator uploads are separate from bundled demo assets. Keep uploaded files and private media outside Git and store them in the backend's persistent upload directory.
