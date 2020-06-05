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
        callback(new Uint8Array(event.target.result), droppedFile);
      };
      reader.readAsArrayBuffer(droppedFile);
    },
    false
  );
}
