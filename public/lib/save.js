export default (function() {
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  return function(data, fileName) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    const blob = new Blob(data, { type: 'octet/stream' });
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };
})();
