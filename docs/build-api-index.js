#!/usr/bin/env node

/**
 * Generate API index page using TypeDoc JSON output
 * This script uses TypeDoc's JSON output to get detailed reflection data
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

async function exists(path) {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const OUTPUT_FILE = path.join(ROOT_DIR, 'docs', 'content', 'api', 'index.mdx');

// TypeDoc reflection kinds (from TypeDoc source)
const ReflectionKind = {
    Project: 1,
    Module: 2,
    Namespace: 4,
    Enum: 8,
    EnumMember: 16,
    Variable: 32,
    Function: 64,
    Class: 128,
    Interface: 256,
    Constructor: 512,
    Property: 1024,
    Method: 2048,
    CallSignature: 4096,
    IndexSignature: 8192,
    ConstructorSignature: 16384,
    Parameter: 32768,
    TypeLiteral: 65536,
    TypeParameter: 131072,
    Accessor: 262144,
    GetSignature: 524288,
    SetSignature: 1048576,
    ObjectLiteral: 2097152,
    TypeAlias: 4194304,
    Reference: 8388608,
};

const API_GROUP_ORDER = ['Classes', 'Enums', 'Types', 'Functions', 'Variables'];
const REFLECTION_KIND_DATA = {
    [ReflectionKind.Class]: { group: 'Classes', path: 'classes' },
    [ReflectionKind.Interface]: { group: 'Types', path: 'interfaces' },
    [ReflectionKind.ObjectLiteral]: { group: 'Types', path: 'type-aliases' },
    [ReflectionKind.TypeAlias]: { group: 'Types', path: 'type-aliases' },
    [ReflectionKind.Function]: { group: 'Functions', path: 'functions' },
    [ReflectionKind.Enum]: { group: 'Enums', path: 'enumerations' },
    [ReflectionKind.Variable]: { group: 'Variables', path: 'variables' },
};

async function findPackageInfos() {
    const packages = [];
    const packageDirs = await fs.readdir(PACKAGES_DIR);

    for (const packageName of packageDirs) {
        const packagePath = path.join(PACKAGES_DIR, packageName);
        const packageJsonPath = path.join(packagePath, 'package.json');
        const srcPath = path.join(packagePath, 'src');
        const indexPath = path.join(srcPath, 'index.ts');
        const typedocConfigPath = path.join(packagePath, 'typedoc.json');

        // Skip packages without source, package.json, or typedoc config.
        const artifactsExistence = await Promise.all([
            exists(packageJsonPath),
            exists(srcPath),
            exists(indexPath),
            exists(typedocConfigPath),
        ]);
        if (artifactsExistence.includes(false)) {
            continue;
        }

        const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        packages.push({ name: pkg.name, path: packagePath });
    }

    return packages.sort((a, b) => a.name.localeCompare(b.name));
}

async function generateTypeDocJSON(packageInfo) {
    const { path: packagePath, name } = packageInfo;
    const jsonOutputPath = path.join(packagePath, 'typedoc-output.json');

    try {
        // Generate JSON output only (suppress regular output).
        await execFileAsync(
            './node_modules/typedoc/bin/typedoc',
            [
                '--json',
                jsonOutputPath,
                '--tsconfig',
                path.join(packagePath, 'tsconfig.json'),
                '--out',
                '/dev/null',
                '--excludePrivate',
                '--excludeProtected',
                '--excludeInternal',
                path.join(packagePath, 'src', 'index.ts'),
            ],
            { cwd: ROOT_DIR },
        );

        if (!(await exists(jsonOutputPath))) {
            console.warn(`⚠️  No JSON output generated for ${name}`);
            return null;
        }

        const typeDocJSON = JSON.parse(await fs.readFile(jsonOutputPath, 'utf8'));

        // Clean up the temp JSON file
        await fs.unlink(jsonOutputPath);

        return typeDocJSON;
    } catch (error) {
        console.error(`❌ Failed to generate JSON for ${name}:`, error.message);
        return null;
    }
}

function processTypeDocJSON(packageInfo, typeDocJSON) {
    const exports = [];
    const dependencies = new Set([]);

    if (!typeDocJSON || !typeDocJSON.children) {
        return { ...packageInfo, dependencies, exports };
    }

    function processChildren(children) {
        for (const child of children) {
            // Only include relevant kinds in the exports.
            if (REFLECTION_KIND_DATA[child.kind]) {
                const fromPackage = typeDocJSON.symbolIdMap[child.id]?.packageName || typeDocJSON.packageName;
                const isDependency = fromPackage !== typeDocJSON.packageName;
                if (isDependency) {
                    dependencies.add(fromPackage);
                } else {
                    exports.push({ name: child.name, kind: child.kind });
                }
            }

            // Recursively process nested children.
            if (child.children) {
                processChildren(child.children);
            }
        }
    }

    processChildren(typeDocJSON.children);
    return { ...packageInfo, dependencies, exports };
}

function generateIndexContent(packages) {
    const totalPackages = packages.length;

    let content = `---
title: API Reference
description: Explore packages, functions, types, and more
---

Welcome to the Solana Kit API Reference! It covers a total of **${totalPackages} packages** most of which are available via the main \`@solana/kit\` package.


## Need Help?

- Check out our [Getting Started guide](/docs/getting-started/).
- Learn about key concepts in our [Core Concept guides](/docs/concepts/).

## All Packages

`;

    // Sort packages by name but with `@solana/kit` first.
    const sortedPackages = packages.sort((a, b) => {
        if (a.name === '@solana/kit') return -1;
        if (b.name === '@solana/kit') return 1;
        return a.name.localeCompare(b.name);
    });

    // Generate entries for each package alphabetically.
    for (const package of sortedPackages) {
        content += `### \`${package.name}\`\n\n`;

        // List exported dependencies.
        if (package.dependencies.size > 0) {
            const dependencies = [...package.dependencies].sort((a, b) => a.localeCompare(b));
            const title = `Packages (${dependencies.length})`;
            content += `${wrapApiGroupTitle(title)}\n\n`;

            const links = dependencies.map(dependency => `[${dependency}](#${dependency.replace(/(@|\/)/g, '')})`);
            content += `${wrapLinks(links, dependencies)}\n\n`;
        }

        // Sort exports into type groups.
        const apiGroups = Object.fromEntries(API_GROUP_ORDER.map(group => [group, { title: group, items: [] }]));
        for (const item of package.exports) {
            if (item.kind && REFLECTION_KIND_DATA[item.kind]) {
                const data = REFLECTION_KIND_DATA[item.kind];
                if (apiGroups[data.group]) {
                    apiGroups[data.group].items.push({ ...item, path: data.path });
                }
            }
        }

        // Generate sections for each type.
        for (const group of Object.values(apiGroups)) {
            if (group.items.length > 0) {
                const title = `${group.title} (${group.items.length})`;
                content += `${wrapApiGroupTitle(title)}\n\n`;

                // List items with links.
                const links = group.items
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(item => `[${item.name}](/api/${item.path}/${item.name})`);

                // Wrap links in columns when possible.
                const names = group.items.map(item => item.name);
                content += `${wrapLinks(links, names)}\n\n`;
            }
        }
    }

    content += `<Callout title="Note">
    This documentation is automatically generated from the source code using TypeDoc.
</Callout>`;

    return content;
}

function wrapApiGroupTitle(content) {
    return `<p className="text-xs tracking-wider uppercase mt-8 -mb-2 text-linen-500 dark:text-linen-400">${content}</p>`;
}

function wrapLinks(links, names) {
    const maxNameLength = Math.max(...names.map(name => name.length));
    let linkWrapper = content => content;
    if (maxNameLength <= 30) {
        linkWrapper = content => `<div className="*:columns-[12rem] *:gap-8">\n\n${content}\n\n</div>`;
    } else if (maxNameLength <= 60) {
        linkWrapper = content => `<div className="*:columns-[20rem] *:gap-8">\n\n${content}\n\n</div>`;
    }

    return linkWrapper(links.join(' \\\n'));
}

// Main execution
async function main() {
    const packageInfos = await findPackageInfos();

    const packages = [];
    await Promise.all(
        packageInfos.map(async packageInfo => {
            const typeDocJSON = await generateTypeDocJSON(packageInfo);
            const package = await processTypeDocJSON(packageInfo, typeDocJSON);
            packages.push(package);
        }),
    );

    const content = generateIndexContent(packages);
    await fs.writeFile(OUTPUT_FILE, content, 'utf8');

    console.log('✅ API index generated successfully!');
    console.log(`├─ Packages: ${packages.length}`);
    console.log(`└─ Output: ${OUTPUT_FILE}`);
}

if (require.main === module) {
    main().catch(console.error);
}
