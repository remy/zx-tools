import hash from './hash';
import changelog from './changelog';

const repo = 'zx-tools';

const footer = document.createElement('footer');
document.body.appendChild(footer);
footer.innerHTML = `<p id="version">Version: <a target="_blank" href="https://github.com/remy/${repo}/compare/${
  hash.prev
}...${hash.curr}">${new Date(hash.timestamp * 1000)
  .toJSON()
  .replace('T', ' ')
  .replace(/:\d{2}\.\d{3}Z$/, '')}</a></p>`;

const icons = {
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path class="filler" d="M21 19v1H3v-1l2-2v-6c0-3.1 2.03-5.83 5-6.71V4a2 2 0 012-2 2 2 0 012 2v.29c2.97.88 5 3.61 5 6.71v6l2 2m-7 2a2 2 0 01-2 2 2 2 0 01-2-2"/></svg>`,
  offline: `<svg viewBox="0 0 32 21" width="16" height="10.5" xmlns="http://www.w3.org/2000/svg"><g fill="none"><path class="toast-cloud" d="M27.883 10.582c.076-.364.117-.744.117-1.132 0-2.899-2.239-5.25-5-5.25-.445 0-.875.06-1.285.175C20.94 1.837 18.675 0 16 0c-2.73 0-5.033 1.914-5.76 4.534A7.645 7.645 0 008 4.2c-4.418 0-8 3.761-8 8.4S3.582 21 8 21h19c2.761 0 5-2.351 5-5.25 0-2.583-1.777-4.73-4.117-5.168z" class="filler" fill="#000"/><path d="M13 18l-5-5 2-2 3 3 7-7 2 2z" fill="none" class="toast-cloud-tick"/></g></svg>`,
};
console.info(
  `Release https://github.com/remy/${repo}/compare/${hash.prev}...${hash.curr}`
);

if (!location.origin.includes('localhost')) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    try {
      if (!localStorage.getItem('toast.offline')) {
        showToast({
          title: 'Available offline',
          icon: icons.offline,
          message:
            'This entire site and all tools are now fully available offline.',
          dismiss() {
            localStorage.setItem('toast.offline', 1);
          },
        });
      }
    } catch (e) {
      // noop
    }
  });
}

if (localStorage.getItem('toast.offline')) {
  const entries = Object.entries(changelog);
  if (entries.length) {
    try {
      const [sha, details] = entries.shift();
      const key = `toast.${sha}`;
      if (!localStorage.getItem(key)) {
        const { title, summary: message } = details;

        const dismiss = () => {
          localStorage.setItem(key, 1);
        };

        showToast({
          title,
          icon: icons.info,
          message,
          dismiss,
        });
      }
    } catch (e) {
      // console.log(e);
      // noop
    }
  }
}

/**
 *
 * @param {options} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {Function} options.dismiss
 * @param {string} options.icon
 */
function showToast(options) {
  const toastTemplate = ({
    title,
    message,
    icon,
  }) => `<div role="alert" aria-live="assertive" aria-atomic="true" class="toast" data-autohide="false">
  <div class="toast-header">
    ${icon}

    <strong class="toast-title">${title}</strong>
    <button type="button" class="close" data-dismiss="toast" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  <div class="toast-body">
    ${message}
  </div>
</div>`;

  const div = document.createElement('div');
  div.innerHTML = toastTemplate(options);
  div.querySelector('button').onclick = () => {
    document.body.removeChild(div);
    if (options.dismiss) options.dismiss();
  };
  document.body.appendChild(div);

  setTimeout(() => document.body.classList.add('show-toast'), 2000);
}
