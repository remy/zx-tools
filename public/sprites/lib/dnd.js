export default function drop(root, callback) {
  root.ondragover = () => false;
  root.ondragend = () => false;
  root.ondrop = e => {
    e.preventDefault();

    const droppedFile = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = event => {
      callback(new Uint8Array(event.target.result));
    };
    reader.readAsArrayBuffer(droppedFile);

    return false;
  };
}
