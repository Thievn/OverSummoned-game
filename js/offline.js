// Offline page: try again on tap, and by itself when the signal returns.
(function () {
  function go() { location.reload(); }
  document.getElementById('retry').addEventListener('click', go);
  addEventListener('online', go);
})();
