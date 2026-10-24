import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("Project entry files exist", () => {
  for (const file of [
    "package.json",
    "src/server.js",
    "src/app.js",
    "prisma/schema.prisma",
    "public/dashboard.html",
    "public/js/dashboard.js",
    "public/js/api.js"
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }
});

test("Package scripts are configured", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8")
  );

  assert.equal(pkg.scripts.start, "node src/server.js");
  assert.equal(pkg.scripts.test, "node --test");
});

test("Prisma schema defines the expected database models", () => {
  const schema = fs.readFileSync(
    path.join(root, "prisma/schema.prisma"),
    "utf8"
  );

  for (const model of ["User", "Session"]) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s*\\{`));
  }
});

test("Dashboard references its JavaScript assets", () => {
  const html = fs.readFileSync(
    path.join(root, "public/dashboard.html"),
    "utf8"
  );

  assert.match(html, /dashboard\.js/);
  assert.match(fs.readFileSync(path.join(root, "public/js/dashboard.js"), "utf8"), /api\.js/);
});
