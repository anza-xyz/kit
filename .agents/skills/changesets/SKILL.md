---
name: changesets
description: Generate a changeset file with a changelog entry for package releases. Use when a PR introduces user-facing changes that should trigger a version bump.
argument-hint: "[patch|minor|major]"
allowed-tools: Bash(npx changeset add --empty)
---

# Generate Changeset

Create a new changeset file for the current project using the [changesets CLI](https://github.com/changesets/changesets), then fill it with a proper changelog entry based on recent changes.

## Key Rules

- Any PR that should trigger a package release MUST include a changeset.
- Identify affected packages by mapping changed files to their nearest `package.json`.
- Choose the right bump: `patch` for fixes, `minor` for features, `major` for breaking changes.
- While a project is pre-1.0, `minor` bumps may be treated as breaking.
- ALWAYS use `npx changeset add --empty` to generate a new changeset file with a random name. NEVER create changeset files manually.
- No changeset needed for: docs-only changes, CI config, dev dependency updates, test-only changes.
- Do NOT modify any existing changeset files.
- Only create one new changeset file per invocation.

## Guidelines

### Changeset Format

```
---
'<package-a>': patch
'<package-b>': patch
---

<concise changelog entry>
```

### Changelog Entries

- Write a concise but informative changelog entry (1-3 sentences).
- Start with a verb — e.g. "Add", "Remove", "Replace", "Fix", "Update".
- Focus on what changed from the user's perspective, not implementation details.
- Mention renamed or removed APIs explicitly.

### Breaking Changes

Add a `**BREAKING CHANGES**` section (bold paragraph, not a header) after the changelog entry when:

- The bump level is `major`, OR
- The bump level is `minor` AND the current major version is `0` (i.e. pre-1.0)

...and the changes actually introduce breaking changes.

The breaking changes section should list each breaking change with a bold title summarizing the change, followed by a brief explanation and a `diff` code block showing the before/after migration when applicable. For example:

```
Replace the `useGranularImports` boolean option with a new `importStrategy` option.

**BREAKING CHANGES**

**`useGranularImports` replaced with `importStrategy`.** The boolean option has been replaced with a string union for finer control.

\`\`\`diff
- renderVisitor('./output', { useGranularImports: true });
+ renderVisitor('./output', { importStrategy: 'granular' });
\`\`\`

**Default import behavior changed.** The default strategy is now `'preferRoot'`, which falls back to granular packages for symbols not on the root entrypoint.

\`\`\`diff
- renderVisitor('./output'); // equivalent to useGranularImports: false
+ renderVisitor('./output'); // equivalent to importStrategy: 'preferRoot'
\`\`\`
```

Not every breaking change needs a diff — use them when there's a clear before/after code change to show. For type removals or behavioral changes, a text explanation is sufficient.

## Command Process

When invoked as a command, follow these steps:

### Arguments

- `[patch|minor|major]` (optional): Override the bump level for all affected packages.

### Steps

1. **Determine the change source.** Check `git status` for uncommitted changes. If there are meaningful working tree changes, use those. Otherwise, use the latest commit(s) on the current branch (compared to the base branch from `.changeset/config.json`).
2. **Identify which packages changed.** Look at which files were modified and map them to their nearest `package.json` to determine affected packages. Ignore changes that are not relevant to a changeset — e.g. typo fixes in comments, dependency version bumps in `package.json`, changes to CI config, docs-only changes in non-doc packages, etc. Use your judgement to filter out noise.
3. **Run `npx changeset add --empty`** to generate a new changeset file with a random name.
4. **Identify the newly created file** — it will be the most recently created `.md` file in `.changeset/` (excluding `README.md`).
5. **Write the changeset file** with the proper frontmatter listing each affected package and the bump level, followed by the changelog entry.
