// main.js
const terminal = document.getElementById('terminal');

function escapeHTML(str){
    return new Option(str).innerHTML;
}

function appendToTerminal(text) {
  terminal.innerHTML += escapeHTML(text) + "<br>";
  terminal.scrollTop = terminal.scrollHeight;
}

async function handleFormAction({ formId, endpoint, startMsg, endMsg }) {
  const form = document.getElementById(formId);
  const formData = new FormData(form);
  appendToTerminal(startMsg);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString(),
    });
    if (!response.ok) throw new Error(await response.text());
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      appendToTerminal(decoder.decode(value));
    }
    appendToTerminal(endMsg);
  } catch (error) {
    appendToTerminal(`Error: ${error.message}`);
  }
}

function handleDiscover() {
  handleFormAction({
    formId: 'discover-form',
    endpoint: '/discover',
    startMsg: `> Discovering API endpoints for: ${document.getElementById('api_url').value}...`,
    endMsg: 'Discovery completed.'
  });
}

function handleRun() {
  handleFormAction({
    formId: 'run-form',
    endpoint: '/run',
    startMsg: '> Running Mayhem scan...',
    endMsg: 'Scan completed.'
  });
}