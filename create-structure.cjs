const fs = require("fs");
const path = require("path");

const folders = [
  "src/assets",
  "src/components",
  "src/components/ui",
  "src/components/layout",
  "src/components/charts",
  "src/components/feedback",
  "src/modules",
  "src/modules/auth",
  "src/modules/auth/pages",
  "src/modules/auth/components",
  "src/modules/auth/hooks",
  "src/modules/dashboard",
  "src/modules/dashboard/pages",
  "src/modules/dashboard/components",
  "src/modules/dashboard/hooks",
  "src/modules/leads",
  "src/modules/leads/pages",
  "src/modules/leads/components",
  "src/modules/leads/hooks",
  "src/modules/quotes",
  "src/modules/quotes/pages",
  "src/modules/quotes/components",
  "src/modules/quotes/hooks",
  "src/modules/calendar",
  "src/modules/calendar/pages",
  "src/modules/calendar/components",
  "src/modules/calendar/hooks",
  "src/modules/users",
  "src/modules/users/pages",
  "src/modules/users/components",
  "src/modules/users/hooks",
  "src/routes",
  "src/context",
  "src/hooks",
  "src/services",
  "src/types",
  "src/utils",
  "src/styles"
];

folders.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log("Created:", dir);
  } else {
    console.log("Already exists:", dir);
  }
});

console.log("\n🚀 Estructura de carpetas creada exitosamente!");
