export default function copyToClipboard(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  const success = document.execCommand("copy");
  document.body.removeChild(tempInput);

  // Provide feedback
  if (success) {
    return true;
  } else {
    return false;
  }
}
