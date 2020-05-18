export async function loadGist() {
  const id = getGistId(window.location.toString());

  if (id.includes('github.com')) {
    return loadGitHub(id);
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

async function loadGitHub(url) {
  const match = url.match(/github\.com\/(.*?)\/(.*?)\/blob\/(.*?)\/(.*)/i);

  if (!match) return;
  match.shift();
  const [owner, repo, ref, path] = match;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${
      ref || 'master'
    }`
  );
  const json = await res.json();
  return atob(json.content);
}

function getGistId(_url) {
  const u = new URL(_url);
  const gist = u.searchParams.get('gist');
  const url = u.searchParams.get('url');
  const id = u.searchParams.get('id');

  let value = gist || url || id;

  if (value.includes('gist.github')) {
    value = value.split('/').pop();
  }

  return value;
}
