const { Command } = require('commander');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const program = new Command();

program
  .option('-h, --host <host>', 'Server host address')
  .option('-p, --port <port>', 'Server port')
  .option('-c, --cache <cachePath>', 'Path to cache directory')
  .parse(process.argv);

const options = program.opts();

if (!options.host || !options.port || !options.cache) {
    console.log('Error: All required options must be specified.');
    process.exit(1);
}

const server = http.createServer(app);
const cacheDir = path.resolve(options.cache);

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
});

app.use(express.json());
const upload = multer();

app.get('/notes/:noteName', (req, res) => {
  const notePath = path.join(cacheDir, req.params.noteName + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  const noteContent = fs.readFileSync(notePath, 'utf-8');
  res.send(noteContent);
});

app.put('/notes/:noteName', express.text(), (req, res) => {
  const notePath = path.join(cacheDir, req.params.noteName + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  fs.writeFileSync(notePath, req.body);
  res.send('Note updated');
});

app.delete('/notes/:noteName', (req, res) => {
  const notePath = path.join(cacheDir, req.params.noteName + '.txt');
  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Not found');
  }
  fs.unlinkSync(notePath);
  res.send('Note deleted');
});

app.get('/notes', (req, res) => {
  const notes = fs.readdirSync(cacheDir).map(file => {
    const noteName = path.parse(file).name;
    const noteText = fs.readFileSync(path.join(cacheDir, file), 'utf-8');
    return { name: noteName, text: noteText };
  });
  res.json(notes);
});

app.post('/write', upload.none(), (req, res) => {
  const { note_name, note } = req.body;
  const notePath = path.join(cacheDir, note_name + '.txt');
  
  if (fs.existsSync(notePath)) {
    return res.status(400).send('Note already exists');
  }
  
  fs.writeFileSync(notePath, note);
  res.status(201).send('Note created');
});

app.get('/UploadForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'UploadForm.html'));
});