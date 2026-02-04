import { execFileSync } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const repoRoot = process.cwd();
const postsDir = path.join(repoRoot, "posts");

async function collectHtmlFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolvedPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectHtmlFiles(resolvedPath);
      }
      if (entry.isFile() && entry.name.endsWith(".html")) {
        return resolvedPath;
      }
      return [];
    })
  );
  return files.flat();
}

function extractTitle(content, fallbackTitle) {
  const match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) {
    return fallbackTitle;
  }
  return match[1].replace(/<[^>]+>/g, "").trim() || fallbackTitle;
}

function extractDateFromContent(content) {
  const metaMatch = content.match(
    /<meta\s+name=["']date["']\s+content=["'](\d{4}-\d{2}-\d{2})["']/i
  );
  if (metaMatch) {
    return metaMatch[1];
  }

  const timeMatch = content.match(
    /<time[^>]*datetime=["'](\d{4}-\d{2}-\d{2})["']/i
  );
  if (timeMatch) {
    return timeMatch[1];
  }

  const commentMatch = content.match(
    /<!--\s*date:\s*(\d{4}-\d{2}-\d{2})\s*-->/i
  );
  if (commentMatch) {
    return commentMatch[1];
  }

  return null;
}

function extractDate(content, fileName, relativeToRepo) {
  const contentDate = extractDateFromContent(content);
  if (contentDate) {
    return contentDate;
  }

  const nameMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  if (nameMatch) {
    return nameMatch[1];
  }

  try {
    const gitDate = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", relativeToRepo],
      { cwd: repoRoot, encoding: "utf8" }
    ).trim();
    if (gitDate) {
      return gitDate;
    }
  } catch (error) {
    console.warn(`Failed to read git date for ${relativeToRepo}:`, error);
  }

  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const htmlFiles = await collectHtmlFiles(postsDir);
  const posts = [];

  for (const filePath of htmlFiles) {
    const content = await fs.readFile(filePath, "utf8");
    const relativeToPosts = path
      .relative(postsDir, filePath)
      .split(path.sep)
      .join("/");
    const relativeToRepo = path
      .relative(repoRoot, filePath)
      .split(path.sep)
      .join("/");

    const pathParts = relativeToPosts.split("/");
    const category = pathParts.length > 1 ? pathParts[0] : "General";
    const fallbackTitle = path.basename(filePath, ".html");
    const title = extractTitle(content, fallbackTitle);
    const date = extractDate(content, path.basename(filePath), relativeToRepo);

    posts.push({ title, date, category, file: relativeToPosts });
  }

  posts.sort(
    (a, b) =>
      b.date.localeCompare(a.date) || a.title.localeCompare(b.title)
  );

  const outputPath = path.join(repoRoot, "posts.json");
  await fs.writeFile(outputPath, `${JSON.stringify(posts, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
