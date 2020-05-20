export async function load() {
  const { id, data } = parseUrl(window.location.toString());

  if (data) {
    // decode and return
    return atob(data);
  }

  const res = await fetch(`https://api.github.com/gists/${id}`);
  const json = await res.json();

  const file = Object.keys(json.files)
    .map((key) => json.files[key])
    .find((_) => _.filename.toLowerCase().endsWith('.bas'));
  if (file) {
    return file.content;
  }
}

function parseUrl(_url) {
  const u = new URL(_url);
  const gist = u.searchParams.get('gist');
  const url = u.searchParams.get('url');
  const id = u.searchParams.get('id');
  const data = u.searchParams.get('data');

  let value = gist || url || id;

  if (value && value.includes('github')) {
    value = value.split('/').pop();
  }

  return { id: value, data };
}
