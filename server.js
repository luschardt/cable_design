#!/usr/bin/env node

const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

const ROOT = __dirname;
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 8000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".tsv": "text/tab-separated-values; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  res.end(body);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function normalizePath(urlPath) {
  const resolved = path.posix.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  return resolved === "/" ? "/index.html" : resolved;
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = normalizePath(url.pathname);
  const filePath = path.join(ROOT, "." + pathname);

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    send(res, 404, "Not found");
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function runWireViz(yamlText) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cableforge-"));
  const inputPath = path.join(tempDir, "harness.yml");
  const basePath = path.join(tempDir, "harness");

  await fs.writeFile(inputPath, yamlText, "utf8");

  return new Promise((resolve, reject) => {
    const child = spawn("wireviz", [inputPath], {
      cwd: tempDir,
      env: process.env,
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", async (error) => {
      await fs.rm(tempDir, { recursive: true, force: true });
      reject(error);
    });

    child.on("close", async (code) => {
      try {
        if (code !== 0) {
          throw new Error(stderr || `wireviz failed with exit code ${code}`);
        }

        const [svg, html, bom, png] = await Promise.all([
          fs.readFile(`${basePath}.svg`, "utf8").catch(() => ""),
          fs.readFile(`${basePath}.html`, "utf8").catch(() => ""),
          fs.readFile(`${basePath}.bom.tsv`, "utf8").catch(() => ""),
          fs.readFile(`${basePath}.png`).catch(() => null),
        ]);

        resolve({
          svg,
          html,
          bom,
          png: png ? png.toString("base64") : "",
          tempDir,
        });
      } catch (error) {
        await fs.rm(tempDir, { recursive: true, force: true });
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/render-wireviz") {
    try {
      const raw = await readBody(req);
      const body = JSON.parse(raw || "{}");
      const yaml = String(body.yaml || "");

      if (!yaml.trim()) {
        sendJson(res, 400, { ok: false, error: "YAML vazio." });
        return;
      }

      const result = await runWireViz(yaml);

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ ok: true, ...result }));

      setTimeout(() => {
        fs.rm(result.tempDir, { recursive: true, force: true }).catch(() => {});
      }, 30_000);
      return;
    } catch (error) {
      const message = String(error?.message || error);
      const friendly = message.includes("ExecutableNotFound") || message.includes("dot")
        ? "Graphviz não encontrado. Instale o pacote `graphviz` no sistema e tente novamente."
        : message.includes("wireviz")
          ? "WireViz não encontrado no PATH. Instale `wireviz` via pip."
          : message;
      sendJson(res, 500, { ok: false, error: friendly });
      return;
    }
  }

  await serveStatic(req, res);
});

server.on("error", (error) => {
  const code = error && typeof error === "object" ? error.code : null;
  if (code === "EADDRINUSE") {
    console.error(`A porta ${PORT} já está em uso.`);
    process.exit(1);
  }
  if (code === "EPERM") {
    console.error(`Sem permissão para abrir ${HOST}:${PORT} neste ambiente.`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`CableForge rodando em http://${HOST}:${PORT}`);
});
