const { bas2file } = require('txt2bas');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed (please POST data=+3dos binary only)',
    };
  }

  try {
    const src = event.body.data;
    const body = bas2file(src);

    return {
      statusCode: 200,
      headers: {
        'content-type': 'text/plain',
      },
      body,
    };
  } catch (err) {
    console.log(err); // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }),
    };
  }
};
