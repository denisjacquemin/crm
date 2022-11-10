function showAlert(message, type = "info") {
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = message;
  document.querySelector("body").prepend(alert);
  setTimeout(() => {
    alert.remove();
  }, 3000);
}
