/* eslint-env node */
const { file2txt } = require('txt2bas');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed (please POST data=+3dos binary only)',
    });
  }

  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).send({
        error: err.message,
      });
    }
    if (!req.file) {
      return res.status(400).send({
        error:
          'Request body must contain `file` POST with binary file contents',
      });
    }
    try {
      const src = Uint8Array.from(req.file.buffer);

      const body = file2txt(src);

      res.status(200);
      res.setHeader('Content-Type', 'text/plain');
      res.send(body);
    } catch (err) {
      console.log(err.stack); // output to netlify function log
      res.status(500).json({ error: err.message });
    }
  });
};
