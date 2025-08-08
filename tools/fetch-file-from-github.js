require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OWNER = 'YOUR_GITHUB_USERNAME';
const REPO = 'Website-Empire';
const BRANCH = 'main';

const fetchFile = async (filePath) => {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}?ref=${BRANCH}`;
  const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3.raw',
  };

  try {
    const response = await axios.get(url, { headers });
    const localPath = path.join(__dirname, '..', filePath);
    fs.writeFileSync(localPath, response.data, 'utf8');
    console.log(`✅ Saved ${filePath} from GitHub to local folder.`);
  } catch (err) {
    console.error(`❌ Failed to fetch file: ${err.response?.data?.message || err.message}`);
  }
};

const targetFile = process.argv[2];
if (!targetFile) {
  console.log('Usage: node fetch-file-from-github.js <relative/path/to/file>');
  process.exit(1);
}

fetchFile(targetFile);
