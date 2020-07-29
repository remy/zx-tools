/**
 * @callback DropCallbackX
 * @param {Uint8Array} data
 * @param {File} file
 * @param {File[]} files
 */

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
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFile = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(
          new Uint8Array(event.target.result),
          droppedFile,
          e.dataTransfer.files
        );
      };
      reader.readAsArrayBuffer(droppedFile);
    },
    false
  );
}
