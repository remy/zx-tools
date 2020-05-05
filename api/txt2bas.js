/* eslint-env node */
const { file2bas, validateTxt } = require('txt2bas');
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
      return res.status(500).send({
        error: err.message,
      });
    }

    try {
      let src = '';
      try {
        if (req.file) {
          src = req.file.buffer;
        } else {
          src = JSON.parse(req.body).text;
        }
      } catch (e) {
        if (req.headers['content-type'].toLowerCase().includes('text/plain')) {
          src = req.body;
        } else {
          if (req.body.text) {
            src = req.body.text;
          } else {
            // god, it's in the body as plain - this is hard
            const key = Object.keys(req.body)[0];
            src = key + '=' + req.body[key].split('\\n').join('\n');
          }
        }
      }

      if (!src) {
        return res.status(400).send({ error: 'Missing submitted content' });
      }

      // look for errors first
      const errors = validateTxt(src);

      if (errors.length) {
        return res.status(400).json({ error: 'Syntax errors found', errors });
      }

      const body = file2bas(src);

      res.send(Buffer.from(body), 'binary');
    } catch (err) {
      console.log(err); // output to netlify function log
      res.status(400).json({ error: err.message });
    }
  });
};
