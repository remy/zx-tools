/** @typedef {(data: Uint8Array, file: File, files: File[]) => boolean} DropCallback */

/**
 *
 * @param {Element} root
 * @param {DropCallback} callback
 */
export default function drop(root, callback) {
  root.ondragover = () => false;
  root.ondragend = () => false;
  root.addEventListener(
    'drop',
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      let droppedFile = e.dataTransfer.files[0];

      if (!droppedFile) {
        const url = e.dataTransfer
          .getData('text/uri-list')
          .replace(/http:/, 'https:');

        const res = await fetch(url);
        const data = await res.arrayBuffer();
        const file = new Blob([data], {
          type: res.headers.get('content-type'),
          name: url,
        });

        callback(new Uint8Array(res), file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          callback(
            new Uint8Array(event.target.result),
            droppedFile,
            e.dataTransfer.files,
            e
          );
        };
        reader.readAsArrayBuffer(droppedFile);
      }
    },
    false
  );
}
