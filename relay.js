// relay.js
require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const BRIDGE_URL = 'http://localhost:3000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function fetchFile(path) {
  return axios.get(`${BRIDGE_URL}/file`, { params: { path } })
    .then(res => res.data.content)
    .catch(err => {
      console.error(`❌ Error fetching ${path}:`, err.response?.data || err.message);
      process.exit(1);
    });
}

function saveFile(path, content) {
  return axios.post(`${BRIDGE_URL}/file`, { path, content })
    .then(() => console.log(`✅ File saved: ${path}`))
    .catch(err => {
      console.error(`❌ Error saving ${path}:`, err.response?.data || err.message);
      process.exit(1);
    });
}

function askFilePath() {
  rl.question('Enter the file path to edit (relative to project): ', async (filePath) => {
    const original = await fetchFile(filePath);

    console.log(`\n📄 Loaded ${filePath}\n---\n${original.slice(0, 500)}\n---`);
    rl.question('\nDescribe what you want changed:\n> ', async (instruction) => {
      console.log('\n✉️ Sending to ChatGPT...');
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant modifying the user's code based on requests. Return only the new full file content." },
          { role: "user", content: `Here's the code:\n\n${original}\n\nMake these changes:\n${instruction}` }
        ],
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const newContent = response.data.choices[0].message.content;
      await saveFile(filePath, newContent);
      rl.close();
    });
  });
}

askFilePath();
