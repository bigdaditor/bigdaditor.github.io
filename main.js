document.addEventListener("DOMContentLoaded", () => {
  const terminal = document.querySelector(".terminal");
  const commands = {
      help: "Available commands:\n - clear\n - help",
      clear: "__clear__"
  }

  function createBlogIntro() {
    const intro = document.createElement("div");
    intro.className = "blog-intro";

    const pre = document.createElement("pre");
    pre.className = "ascii-welcome";
    pre.textContent = `
__        __   _                            _         
\\ \\      / /__| | ___ ___  _ __ ___   ___  | |_ ___    
 \\ \\ /\\ / / _ \\ |/ __/ _ \\| '_ \` _ \\ / _ \\ | __/ _ \\   
  \\ V  V /  __/ | (_| (_) | | | | | |  __/ | || (_) |  
   \\_/\\_/ \\___|_|\\___\\___/|_| |_| |_|\\___|  \\__\\___/   
`;

    const desc = document.createElement("p");
    desc.innerHTML = 'This is the blog of <strong>bigdaditor</strong>. Type <code>help</code> to get started!';

    intro.appendChild(pre);
    intro.appendChild(desc);
    terminal.appendChild(intro);
  }

  function createPromptLine() {
    const line = document.createElement("div");
    line.className = "prompt-line";

    const user = document.createElement("span");
    user.className = "username";
    user.textContent = "bigdaditor@blog";

    const path = document.createElement("span");
    path.className = "path";
    path.textContent = "~";

    const dollar = document.createTextNode("$ ");

    const input = document.createElement("input");
    input.type = "text";
    input.className = "terminal-input";
    input.autofocus = true;

    line.appendChild(user);
    line.appendChild(document.createTextNode(":"));
    line.appendChild(path);
    line.appendChild(document.createTextNode(" "));
    line.appendChild(dollar);
    line.appendChild(input);

    terminal.appendChild(line);
    input.focus();

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim();
        input.disabled = true;
        handleCommand(cmd);
      }
    });
  }

  function handleCommand(cmd) {
    if (cmd === "") {
      createPromptLine();
      return;
    }

    if (commands[cmd]) {
      if (commands[cmd] === "__clear__") {
        terminal.innerHTML = "";
        createPromptLine();
      } else {
        const output = document.createElement("div");
        output.textContent = commands[cmd];
        terminal.appendChild(output);
        createPromptLine();
      }
    } else {
      const output = document.createElement("div");
      output.textContent = `command not found: ${cmd}`;
      terminal.appendChild(output);
      createPromptLine();
    }

    window.scrollTo(0, document.body.scrollHeight);
  }

  // Start terminal
  terminal.innerHTML = "";
  createBlogIntro();
  createPromptLine();
});