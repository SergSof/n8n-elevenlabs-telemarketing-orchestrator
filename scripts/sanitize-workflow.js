#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const [inputArg, outputArg] = process.argv.slice(2);

if (!inputArg) {
  console.error('Usage: node scripts/sanitize-workflow.js <input.json> [output.json]');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const workflow = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let replacements = 0;

const rules = [
  {
    pattern: /https?:\/\/[^"'\\\s]+\/soap\/IBusinessAPI/gi,
    replacement: 'MEKASHRON_API_URL',
  },
  {
    pattern: /https?:\/\/[^"'\\\s]+\/webhook\/telemarketing-elevenlabs-start/gi,
    replacement: 'SELF_START_WEBHOOK_URL',
  },
  {
    pattern: /\bsk_[a-zA-Z0-9_-]{16,}\b/g,
    replacement: 'ELEVENLABS_API_KEY',
  },
  {
    pattern: /\bagent_[a-zA-Z0-9_-]{12,}\b/g,
    replacement: 'ELEVENLABS_AGENT_ID',
  },
  {
    pattern: /\bphnum_[a-zA-Z0-9_-]{12,}\b/g,
    replacement: 'ELEVENLABS_PHONE_NUMBER_ID',
  },
];

function sanitizeString(value) {
  let result = value;
  for (const rule of rules) {
    result = result.replace(rule.pattern, () => {
      replacements += 1;
      return rule.replacement;
    });
  }
  return result;
}

function walk(value) {
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map(walk);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, walk(child)]),
    );
  }
  return value;
}

const sanitized = walk(workflow);

if (outputArg) {
  const outputPath = path.resolve(outputArg);
  fs.writeFileSync(outputPath, `${JSON.stringify(sanitized, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${outputPath}`);
} else {
  console.log(JSON.stringify(sanitized, null, 2));
}

console.error(`Replacements: ${replacements}`);
