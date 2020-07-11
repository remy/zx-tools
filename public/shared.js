if (!location.origin.includes('localhost')) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    try {
      if (!localStorage.getItem('toast.offline')) {
        showToast({
          title: 'Available offline',
          message:
            'This entire site and all tools are now fully available offline.',
          dismiss() {
            localStorage.setItem('toast.offline', 1);
          },
        });
      }
    } catch (e) {}
  });
}

/**
 *
 * @param {options} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {function} options.dismiss
 */
function showToast(options) {
  const toastTemplate = ({
    title,
    message,
  }) => `<div role="alert" aria-live="assertive" aria-atomic="true" class="toast" data-autohide="false">
  <div class="toast-header">
    <svg viewBox="0 0 32 21" width="16" height="10.5" xmlns="http://www.w3.org/2000/svg">
      <g fill-rule="nonzero" fill="none">
        <path
          class="toast-cloud"
          d="M27.883 10.582c.076-.364.117-.744.117-1.132 0-2.899-2.239-5.25-5-5.25-.445 0-.875.06-1.285.175C20.94 1.837 18.675 0 16 0c-2.73 0-5.033 1.914-5.76 4.534A7.645 7.645 0 008 4.2c-4.418 0-8 3.761-8 8.4S3.582 21 8 21h19c2.761 0 5-2.351 5-5.25 0-2.583-1.777-4.73-4.117-5.168z"
          fill="#000" />
        <path d="M13 18l-5-5 2-2 3 3 7-7 2 2z" fill="#FFF" class="toast-cloud-tick" />
      </g>
    </svg>

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
