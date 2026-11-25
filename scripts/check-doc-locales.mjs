import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage']);
const errors = [];

async function collectMarkdownFiles(directory = root) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectMarkdownFiles(absolutePath));
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      files.push(path.relative(root, absolutePath));
    }
  }

  return files.sort();
}

function chinesePathFor(file) {
  return file.replace(/\.(md|mdx)$/, '.zh.$1');
}

function englishPathFor(file) {
  return file.replace(/\.zh\.(md|mdx)$/, '.$1');
}

function countMatches(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

function localMarkdownTargets(content) {
  const targets = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of content.matchAll(pattern)) {
    let target = match[1].trim();
    if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
    target = target.split('#', 1)[0].split('?', 1)[0];
    if (/\.mdx?$/.test(target)) targets.push(decodeURIComponent(target));
  }

  return targets;
}

const files = await collectMarkdownFiles();
const fileSet = new Set(files);
const englishFiles = files.filter((file) => !file.endsWith('.zh.md') && !file.endsWith('.zh.mdx'));
const chineseFiles = files.filter((file) => file.endsWith('.zh.md') || file.endsWith('.zh.mdx'));

for (const file of englishFiles) {
  const chineseFile = chinesePathFor(file);
  if (!fileSet.has(chineseFile)) {
    errors.push(`${file}: missing ${chineseFile}`);
    continue;
  }

  const [english, chinese] = await Promise.all([
    fs.readFile(path.join(root, file), 'utf8'),
    fs.readFile(path.join(root, chineseFile), 'utf8'),
  ]);
  const chineseBasename = path.basename(chineseFile);
  const englishBasename = path.basename(file);

  if (!english.includes(`[简体中文](${chineseBasename})`)) {
    errors.push(`${file}: missing Simplified Chinese language link`);
  }
  if (!chinese.includes(`[English](${englishBasename})`)) {
    errors.push(`${chineseFile}: missing English language link`);
  }
  if (countMatches(english, /^\s*(?:```|~~~)/gm) !== countMatches(chinese, /^\s*(?:```|~~~)/gm)) {
    errors.push(`${chineseFile}: fenced code block markers differ from ${file}`);
  }
  if (countMatches(english, /^#{1,6}\s+/gm) !== countMatches(chinese, /^#{1,6}\s+/gm)) {
    errors.push(`${chineseFile}: heading count differs from ${file}`);
  }
}

for (const file of chineseFiles) {
  const englishFile = englishPathFor(file);
  if (!fileSet.has(englishFile)) errors.push(`${file}: missing ${englishFile}`);
  if (/\.zh\.zh\.(?:md|mdx)$/.test(file)) errors.push(`${file}: duplicate locale suffix`);

  const content = await fs.readFile(path.join(root, file), 'utf8');
  if (/zzqph|zxqph|⟦PH\d+⟧/i.test(content)) errors.push(`${file}: contains an unreplaced translation placeholder`);
}

for (const file of files) {
  const content = await fs.readFile(path.join(root, file), 'utf8');
  for (const target of localMarkdownTargets(content)) {
    const resolved = path.normalize(path.join(path.dirname(file), target));
    if (!fileSet.has(resolved)) errors.push(`${file}: broken Markdown link ${target}`);
  }
}

if (errors.length > 0) {
  console.error(`Documentation locale check failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation locale check passed for ${englishFiles.length} English and ${chineseFiles.length} Chinese files.`);
}
