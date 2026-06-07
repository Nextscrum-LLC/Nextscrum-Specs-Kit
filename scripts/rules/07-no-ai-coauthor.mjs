// Copyright (c) 2026 NextScrum LLC. Apache-2.0 Licensed. Part of nextscrum-specs-kit.
//
// scripts/rules/07-no-ai-coauthor.mjs
//
// no-ai-coauthor: no "Co-Authored-By: <AI tool>" trailer in recent
// commits. Look at the last 5 local commits. The commit-msg husky hook
// blocks new ones; this check surfaces any that slipped through.

import { execSync } from "node:child_process";
import { ROOT } from "./_shared.mjs";

export default {
  id: "r7-no-ai-coauthor",
  label: "no-ai-coauthor: no AI co-author trailers in recent commits",
  async run({ ok, warn }) {
    try {
      const log = execSync(`git log -5 --pretty=format:"%H%n%B%n---END---"`, { cwd: ROOT }).toString();
      const offenders = [];
      for (const block of log.split("---END---")) {
        const m = block.match(/^([a-f0-9]{40})\n([\s\S]*)$/);
        if (!m) continue;
        const [, sha, body] = m;
        if (/Co-Authored-By:\s*(Claude|ChatGPT|GPT|Copilot|Anthropic|OpenAI|noreply@anthropic\.com)/i.test(body)) {
          offenders.push(sha.slice(0, 7));
        }
      }
      if (offenders.length > 0) {
        warn(`R3 no-ai-attribution: recent commits with AI co-author trailer: ${offenders.join(", ")}`);
        warn("    Going forward the commit-msg hook blocks new ones.");
      } else {
        ok("R3 no-ai-attribution: no AI co-author trailers in recent commits");
      }
    } catch {
      // git not available or no history; non-fatal.
    }
  },
};
