function resultEncoded(data) {
  const length = data.length;
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(data.charCodeAt(i));
  }
  return Uint8Array.from(result);
}

export async function load() {
  const { id, url = '', data = null } = parseUrl(window.location.toString());

  if (data) {
    // decode and return
    return resultEncoded(atob(data));
  }

  if (url.includes('/github.com')) {
    return loadGitHub(url);
  }

  if (url.includes('gitlab')) {
    return loadGitLab(url);
  }

  if (!id && url) {
    return loadCustom(url);
  }

  // default to gist
  const res = await fetch(`https://api.github.com/gists/${id}`);
  const json = await res.json();

  const files = Object.keys(json.files).map((key) => json.files[key]);
  let file = files.find((_) => _.filename.toLowerCase().endsWith('.bas'));

  if (!file) {
    // find the first text file
    file = files.find((_) => _.type.toLowerCase() === 'text/plain');
  }
  if (file) {
    return resultEncoded(file.content);
  }
}

async function loadCustom(url) {
  const res = await fetch('/request?url=' + encodeURIComponent(url));
  const text = await res.text();
  return resultEncoded(text);
}

async function loadGitLab(url) {
  const match = url.match(/gitlab\.com\/(.*?)\/(.*?)\/-\/blob\/(.*?)\/(.*)/i);

  if (!match) return;
  match.shift();
  const [owner, repo, ref, path] = match;

  // gitlab we need to lookup the projectId which I could only find in graphql
  let res = await fetch('https://gitlab.com/api/graphql', {
    method: 'post',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      query: `query {
      project(fullPath:"${owner}/${repo}") {
        id
      }
    }`,
    }),
  });

  let json = await res.json();
  const id = json.data.project.id.split('/').pop();

  res = await fetch(
    `https://gitlab.com/api/v4/projects/${id}/repository/files/${encodeURIComponent(
      path
    )}?ref=${ref || 'master'}`
  );
  json = await res.json();
  return resultEncoded(atob(json.content));
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
  return resultEncoded(atob(json.content));
}

function parseUrl(_url) {
  const u = new URL(_url);
  const url = u.searchParams.get('url') || '';
  const data = u.searchParams.get('data') || '';
  let id = u.searchParams.get('id') || u.searchParams.get('gist');

  if (id && id.includes('github')) {
    id = id.split('/').pop();
  }

  if (url.includes('gist.')) {
    id = url.split('/').pop();
  }

  return { id, data, url };
}
