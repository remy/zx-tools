/* eslint-env node */
const { file2txt } = require('txt2bas');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed (please POST data=+3dos binary only)',
    });
  }

  const url = req.query.url;

  const request = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer',
  });
  const buffer = request.data;
  const text = file2txt(buffer);
  res.send(text);
};
