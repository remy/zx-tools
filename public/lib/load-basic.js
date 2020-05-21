function resultEncoded(data) {
  const length = data.length;
  const result = [];
  for (let i = 0; i < length; i++) {
    result.push(data.charCodeAt(i));
  }
  return Uint8Array.from(result);
}

export async function load() {
  const { id, data } = parseUrl(window.location.toString());

  if (data) {
    // decode and return
    return atob(data);
  }

  if (id.includes('github.com')) {
    return loadGitHub(id);
  }

  if (id.includes('gitlab')) {
    return loadGitLab(id);
  }

  // default to gist
  const res = await fetch(`https://api.github.com/gists/${id}`);
  const json = await res.json();

  const file = Object.keys(json.files)
    .map((key) => json.files[key])
    .find((_) => _.filename.toLowerCase().endsWith('.bas'));
  if (file) {
    return resultEncoded(file.content);
  }
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
