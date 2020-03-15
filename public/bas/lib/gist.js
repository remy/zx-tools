export async function loadGist() {
  const id = getGistId(window.location.toString());
  const res = await fetch(`https://api.github.com/gists/${id}`);
  const json = await res.json();

  const file = Object.keys(json.files)
    .map(key => json.files[key])
    .find(_ => _.filename.toLowerCase().endsWith('.bas'));
  if (file) {
    return file.content;
  }
}

function getGistId(_url) {
  const u = new URL(_url);
  const gist = u.searchParams.get('gist');
  const url = u.searchParams.get('url');
  const id = u.searchParams.get('id');

  let value = gist || url || id;

  if (value.includes('github')) {
    value = value.split('/').pop();
  }

  return value;
}
