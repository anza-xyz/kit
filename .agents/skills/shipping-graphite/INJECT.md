---
heading: Shipping (Graphite)
---

- Check if [Graphite](https://graphite.dev/) is installed (`which gt`). Prefer Graphite when available; fall back to the Git shipping workflow otherwise.
- NEVER commit, push, create branches, or create PRs without explicit user approval.
- Before any git operation that creates or modifies a commit, present a review block containing: changeset entry (if applicable), commit title, and commit/PR description. ALWAYS wait for approval.
- Use `gt create -am "Title" -m "Description body"` for new PRs. The first `-m` sets the commit title; the second sets the PR description.
- Use `gt modify -a` to amend the current branch with follow-up changes (NEVER create additional commits on the same branch).
- ALWAYS escape backticks in commit messages with backslashes for shell compatibility (e.g. `"Update \`my-package\` config"`).
- Do NOT run `gt submit` after committing. Only run it when the user explicitly asks to submit or push.
- Write commit and PR descriptions as natural flowing prose. Do NOT insert hard line breaks mid-paragraph.
