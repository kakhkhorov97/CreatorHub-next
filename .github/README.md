# GitHub checks

`workflows/ci.yml` checks pushes to develop/main and pull requests using Node 22, the lockfile, TypeScript, tests, the recorded API contract, and a production build. It uses no production credentials and does not deploy.

Deployment of both repositories is coordinated manually by **Deploy CreatorHub** in `kakhkhorov97/CreatorHub`, the backend repository. See its `deploy/docker/CICD.md` for the restricted SSH setup, production environment secrets, and release/recovery procedure. Frontend changes are deployed only when that workflow is run with a commit pair that includes them.
