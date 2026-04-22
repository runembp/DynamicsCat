import { joinSession } from "@github/copilot-sdk/extension";
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

const SRC_DIR = "src";
const LINT_EXTENSIONS = new Set([".ts", ".js", ".mjs"]);

function runLint(cwd, filePath) {
    return new Promise((resolve) => {
        // Use npx eslint scoped to the file; --no-eslintrc fallback if config missing
        const cmd = `npx eslint "${filePath}" --max-warnings=0`;
        exec(cmd, { cwd }, (err, stdout, stderr) => {
            if (!err) {
                resolve(null); // no issues
            } else {
                resolve((stdout || stderr || "Lint failed with no output.").trim());
            }
        });
    });
}

const session = await joinSession({
    hooks: {
        onPostToolUse: async (input) => {
            const toolName = input.toolName;
            if (toolName !== "edit" && toolName !== "create") return;

            const filePath = input.toolArgs?.path;
            if (!filePath) return;

            // Only lint files inside the src/ directory
            const ext = filePath.slice(filePath.lastIndexOf("."));
            if (!LINT_EXTENSIONS.has(ext)) return;

            const normalised = filePath.replace(/\\/g, "/");
            if (!normalised.includes(`/${SRC_DIR}/`) && !normalised.endsWith(`/${SRC_DIR}`)) return;

            const cwd = input.cwd ?? process.cwd();

            // Confirm the file actually exists before linting
            const abs = resolve(cwd, filePath);
            if (!existsSync(abs)) return;

            await session.log(`[lint-guard] Linting…`, { ephemeral: true });

            const lintOutput = await runLint(cwd, filePath);
            if (lintOutput) {
                await session.log(`[lint-guard] ⚠ Lint errors in ${filePath}`, { level: "warning" });
                return {
                    additionalContext: `ESLint found issues in ${filePath}:\n\n${lintOutput}`,
                };
            } else {
                await session.log(`[lint-guard] ✓`, { ephemeral: true });
            }
        },
    },
    tools: [],
});
