---
name: ts-readme
description: Guidelines for writing developer-friendly READMEs for TypeScript libraries. Use when creating a new package, changing a public API, or updating documentation.
argument-hint: "[path]"
---

# Create or Update README

Create a new README or update an existing one for a TypeScript package, library, or project.

## Key Rules

- When adding a new public API, add or update the package's README.
- Structure: brief intro, installation, usage (with code snippet), deep-dive sections.
- Code snippets must be realistic, concise, and use TypeScript syntax.
- Focus on the quickest path to success. Developers should feel excited, not overwhelmed.
- Do NOT update any real code outside of the README file itself. If you identify errors in the codebase, warn the user but do not fix them.

## Guidelines

A deep understanding of the project is necessary to create an effective README. Analyze the codebase, key features, and typical usage patterns to inform the content. If the project relies on other libraries or frameworks, consider how those influence usage and installation.

### Structure

The layout of a README will vary from project to project, but they should generally follow these guidelines.

#### 1. Intro Section

- Package/library name as the main heading.
- Badges for tests, package version, downloads, etc. (npm, GitHub, etc.).
- **Very brief summary (ELI5)** — A single sentence or short paragraph that anyone can understand at first glance.
- Only update the intro if you can meaningfully improve the summary; otherwise leave it intact.

#### 2. Installation Section

- Keep it extremely concise (1-2 lines of explanation max if necessary).
- Show the install command in a code block.

#### 3. Usage Section (Most Critical)

- This is where readers' attention lands first after the intro.
- Show the **quickest path to success** with this library.
- **Must include a code snippet** illustrating basic usage.
- Balance between brevity and clarity to create an "aha moment."
- Optional: Brief text before/after the snippet if it adds clarity.
- The code snippet should be realistic, concise, and immediately understandable.

#### 4. Deep Dive Sections

- Structure varies case-by-case based on the project.
- Document key features, concepts, or use cases.
- Each section should include **at least one code snippet**. Similar guidelines as the Usage section, that is, realistic and concise (shortest path to "aha moment").
- Organize logically (e.g. by feature, by use case, by complexity).
- Common patterns:
    - **Features**: Individual feature documentation with examples.
    - **API Reference**: Core APIs or functions.
    - **Advanced Usage**: More complex scenarios.
    - **Configuration**: Setup and customization options.
    - **Examples**: Real-world use cases.
- No need for a "Requirements" section for peer dependencies. Just mention them in the "Installation" section if necessary to get started.

### Code Snippets

- Use TypeScript syntax for TypeScript projects.
- Show realistic but concise examples.
- Include necessary imports when relevant (e.g. when importing from multiple modules).
- Use descriptive variable names (not `foo`, `bar`).
- Keep examples focused on one concept at a time when possible.
- Format for readability (proper indentation, spacing).

### Tone

- Friendly and approachable.
- Clear and direct.
- Avoid marketing speak.
- Focus on practical value.
- Use active voice.
- Assume the reader is a developer who wants to get started quickly.

### What to Avoid

- Overly long introductions or preambles.
- Walls of text without code examples.
- Complex examples in the Usage section.
- Unexplained jargon or acronyms.
- Marketing-heavy language.
- Duplicating information unnecessarily.

### Monorepo Considerations

When working in a monorepo:

- **Package READMEs**: Focus on the specific package — its API, installation, usage, and features. Include an installation note pointing to an umbrella package as an alternative if one exists.
- **Root README**: Provides an overview of the entire monorepo, links to individual package READMEs for details. Focus on the quick-start experience rather than deep-diving into each package.
- **Consistency**: When updating a package README, check other package READMEs for structural consistency (heading levels, section order, code example style).

## Command Process

When invoked as a command, follow these steps:

### Arguments

- `[path]` (optional): Path to the README file or its parent directory. Defaults to `./README.md`.

### Steps

1. Determine the target README path:
    - If a path argument is provided and ends with `.md`, use it directly.
    - If the argument is a directory path, use `<path>/README.md`.
    - If no argument is provided, use `./README.md`.

2. Check if the README exists:
    - If it exists, read it to understand the current structure.
    - If it doesn't exist, prepare to create one from scratch.

3. Analyze the project context:
    - Examine `package.json` (if exists) for package name, description, dependencies.
    - Look at the source code to understand what the library does.
    - Identify key exports, main functions, and typical usage patterns.
    - Check for existing tests or examples that show usage.
    - Research any related libraries or frameworks that influence usage.
    - If in a monorepo, examine other package READMEs to ensure consistency in style and structure.

4. Create or update the README:
    - **For existing READMEs**: Identify missing sections or areas needing improvement.
    - **For new READMEs**: Build the full structure following the guidelines.
    - Preserve the intro unless improvements are clear.
    - Ensure the Usage section has a strong, clear example.
    - Add or improve deep dive sections as needed.
    - Include realistic code snippets throughout.

5. Present the complete README for review before applying changes.
