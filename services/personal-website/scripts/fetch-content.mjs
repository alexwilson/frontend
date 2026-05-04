import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve('src/content/posts');
const REPO = 'github.com/alexwilson/content.git';
const BRANCH = 'main';

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.warn('Warning: GITHUB_TOKEN not set. Attempting clone without authentication.');
}

const remote = token
  ? `https://alexwilson:${token}@${REPO}`
  : `https://${REPO}`;

if (existsSync(CONTENT_DIR)) {
  console.log('Content directory exists, pulling latest changes...');
  execSync(`git -C ${CONTENT_DIR} fetch origin ${BRANCH} && git -C ${CONTENT_DIR} reset --hard origin/${BRANCH}`, {
    stdio: 'inherit',
  });
} else {
  console.log('Cloning content repository...');
  mkdirSync(path.dirname(CONTENT_DIR), { recursive: true });
  execSync(`git clone --depth 1 --branch ${BRANCH} ${remote} ${CONTENT_DIR}`, {
    stdio: 'inherit',
  });
}

console.log('Content fetched successfully.');
