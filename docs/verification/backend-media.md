# Backend image delivery check — 5 October 2026

Before removing the duplicate frontend folder, all 51 files matched backend `public/demo-media/` and `dist/apps/Creator-api/public/demo-media/` by SHA-256. The Atlas database currently has 52 `/demo-media/` references across avatar and project fields, covering 27 unique paths; every referenced path has a backend file.

After rebuilding and restarting both applications, `GET http://127.0.0.1:7001/demo-media/morrow-cafe.png` and `GET http://127.0.0.1:7007/demo-media/morrow-cafe.png` both returned HTTP 200, `image/png`, and byte-identical files. The backend request log recorded both requests, confirming the frontend rewrite reached the backend. Backend format, typecheck, lint and build passed; frontend typecheck, lint and production build passed. The backend build packaged 51 files. No deployed-host check was performed.

The duplicate frontend `public/demo-media/` folder was removed after this byte-for-byte check. Demo seed scripts now read or generate artwork in the backend media folder. The frontend continues to request `/demo-media/<filename>` through the backend rewrite.

After the frontend copy was removed, frontend typecheck, lint, all 12 unit tests and a production build passed. Requests through port 7007 for one SVG portrait and three PNG project images each returned HTTP 200 with bytes matching the backend source files. The frontend folder remains absent.
