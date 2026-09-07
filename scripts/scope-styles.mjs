// One-time migration: scope the two original stylesheets so their tokens and
// generic selectors cannot override each other after visiting either route.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const tailwindRequire = createRequire(require.resolve("@tailwindcss/postcss"));
const postcss = tailwindRequire("postcss");

for (const [file, scope] of [["app/globals.css", ".landing-site"], ["app/register/telemed.css", ".telemed-site"]]) {
  const source = readFileSync(file, "utf8");
  if (source.includes("/* scoped migration */")) continue;
  const root = postcss.parse(source);
  root.walkAtRules("import", rule => rule.remove());
  root.walkRules(rule => {
    let parent = rule.parent;
    while (parent) {
      if (parent.type === "atrule" && /keyframes$/.test(parent.name)) return;
      parent = parent.parent;
    }
    rule.selectors = rule.selectors.map(selector => {
      if ([":root", "html", "body"].includes(selector.trim())) return scope;
      return `${scope} ${selector}`;
    });
  });
  const base = scope === ".landing-site"
    ? '@import "tailwindcss";\nhtml { scroll-behavior: smooth; }\nbody { margin: 0; }\n'
    : "";
  writeFileSync(file, `/* scoped migration */\n${base}${root.toString()}\n${scope} { min-height: 100vh; display: flow-root; }\n`);
}
