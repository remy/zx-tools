/* eslint-env node */
const { file2bas } = require('txt2bas');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = (req, res) => {
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
          src = req.body.text;
        }
      }

      if (!src) {
        console.log(req.headers);
        return res.status(400).send({ error: 'Missing submitted content' });
      }

      const body = file2bas(src);

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(Buffer.from(body), 'binary');
    } catch (err) {
      console.log(err); // output to netlify function log
      res.status(500).json({ error: err.message });
    }
  });
};
