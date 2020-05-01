const { file2bas } = require('txt2bas');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed (please POST text=NextBASIC only)',
    };
  }

  const src = event.body.text;
  try {
    const body = file2bas(src);

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/octet-stream',
      },
      body,
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({
        msg: err.message,
        stack: err.stack,
        src,
        body: JSON.stringify(event.body),
      }),
    };
  }
};
