const terminal = document.querySelector(".terminal");
let currentPath = "";

const commands = {
    help: () => {
        const output = document.createElement("div");
        output.innerHTML = `Available commands:
  help          - Show this help
  clear         - Clear terminal
  ls            - List files in current directory
  cd &lt;dir&gt;      - Change directory (cd posts, cd ..)
  cat &lt;file&gt;    - Read a post`.replace(/\n/g, "<br>");
        terminal.appendChild(output);
        createPromptLine();
    },
    clear: () => {
        terminal.innerHTML = "";
        createPromptLine();
    },
    ls: () => {
        let apiPath = 'https://api.github.com/repos/bigdaditor/bigdaditor.github.io/contents/';
        if (currentPath === "posts") {
            apiPath += '_posts';
        } else if (currentPath) {
            apiPath += currentPath;
        }

        fetch(apiPath)
            .then(response => response.json())
            .then(data => {
                const output = document.createElement("div");
                output.className = "ls-output";

                if (Array.isArray(data)) {
                    const list = data.map(item => {
                        let name = item.name;
                        if (item.type === 'dir') {
                            name += '/';
                        } else if (name.endsWith('.md') && currentPath === 'posts') {
                            // Show post title instead of filename
                            name = name.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '');
                        }
                        return name;
                    }).join('\n');
                    output.innerHTML = list.replace(/\n/g, "<br>") || "(empty)";
                } else {
                    output.textContent = "(empty)";
                }
                terminal.appendChild(output);
                createPromptLine();
            })
            .catch(err => {
                const error = document.createElement("div");
                error.textContent = `ls: cannot access: ${err.message}`;
                terminal.appendChild(error);
                createPromptLine();
            });
    },
    cd: (args) => {
        const dir = args[0];
        if (!dir || dir === "~") {
            currentPath = "";
        } else if (dir === "..") {
            currentPath = "";
        } else if (dir === "posts" || dir === "_posts") {
            currentPath = "posts";
        } else {
            const output = document.createElement("div");
            output.textContent = `cd: ${dir}: No such directory`;
            terminal.appendChild(output);
        }
        createPromptLine();
    },
    cat: (args) => {
        const filename = args[0];
        if (!filename) {
            const output = document.createElement("div");
            output.textContent = "cat: missing file operand";
            terminal.appendChild(output);
            createPromptLine();
            return;
        }

        // Find post file
        fetch('https://api.github.com/repos/bigdaditor/bigdaditor.github.io/contents/_posts')
            .then(response => response.json())
            .then(files => {
                const file = files.find(f =>
                    f.name.includes(filename) ||
                    f.name.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.md', '') === filename
                );

                if (!file) {
                    const output = document.createElement("div");
                    output.textContent = `cat: ${filename}: No such file`;
                    terminal.appendChild(output);
                    createPromptLine();
                    return;
                }

                return fetch(file.download_url);
            })
            .then(response => {
                if (response) return response.text();
            })
            .then(content => {
                if (!content) return;

                const output = document.createElement("div");
                output.className = "cat-output";

                // Parse frontmatter and content
                const parts = content.split('---');
                let body = content;
                let title = '';
                let date = '';

                if (parts.length >= 3) {
                    const frontmatter = parts[1];
                    body = parts.slice(2).join('---').trim();

                    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
                    const dateMatch = frontmatter.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
                    if (titleMatch) title = titleMatch[1];
                    if (dateMatch) date = dateMatch[1];
                }

                // Simple markdown to HTML
                let html = '';
                if (title) html += `<h1 class="post-title">${title}</h1>`;
                if (date) html += `<div class="post-date">${date}</div>`;
                html += '<div class="post-body">' + markdownToHtml(body) + '</div>';

                output.innerHTML = html;
                terminal.appendChild(output);
                createPromptLine();
            })
            .catch(err => {
                const error = document.createElement("div");
                error.textContent = `cat: error reading file: ${err.message}`;
                terminal.appendChild(error);
                createPromptLine();
            });
    }
};

function markdownToHtml(md) {
    return md
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
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
    path.textContent = currentPath ? `~/${currentPath}` : "~";

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

function handleCommand(cmdLine) {
    if (cmdLine === "") {
        createPromptLine();
        return;
    }

    const parts = cmdLine.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (commands[cmd]) {
        if (cmd === 'cd' || cmd === 'cat') {
            commands[cmd](args);
        } else {
            commands[cmd]();
        }
    } else {
        const output = document.createElement("div");
        output.textContent = `command not found: ${cmd}`;
        terminal.appendChild(output);
        createPromptLine();
    }

    window.scrollTo(0, document.body.scrollHeight);
}

document.addEventListener("DOMContentLoaded", () => {
    terminal.innerHTML = "";
    createBlogIntro();
    createPromptLine();
});
