import { ThemeDefinition } from "./theme";

const kebabCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();

const formatValue = (path: string[], value: string | number) => {
  if (typeof value !== "number") return value;

  const lastSegment = path[path.length - 1].toLowerCase();
  if (lastSegment.includes("duration")) return `${value}ms`;
  if (path.includes("spacing") || path.includes("radius")) return `${value}px`;
  if (lastSegment.includes("font-size") || lastSegment.endsWith("size")) return `${value}px`;
  if (lastSegment.includes("letter-spacing")) return `${value}px`;

  return value.toString();
};

export const applyTheme = (theme: ThemeDefinition) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const setVariables = (prefix: string[], obj: Record<string, unknown>) => {
    Object.entries(obj).forEach(([key, val]) => {
      const nextPath = [...prefix, kebabCase(key)];
      if (val && typeof val === "object") {
        setVariables(nextPath, val as Record<string, unknown>);
      } else {
        root.style.setProperty(`--${nextPath.join("-")}`, formatValue(nextPath, val as string | number));
      }
    });
  };

  setVariables(["color"], theme.colors);
  setVariables(["spacing"], theme.spacing as Record<string, unknown>);
  setVariables(["typography"], theme.typography as Record<string, unknown>);
  setVariables(["shadow"], theme.shadows as Record<string, unknown>);
  setVariables(["radius"], theme.radius as Record<string, unknown>);
  setVariables(["animation"], theme.animation as Record<string, unknown>);

  root.dataset.theme = theme.mode;
  root.style.setProperty("color-scheme", theme.mode);
  root.style.setProperty(
    "transition",
    "background-color 300ms ease, color 300ms ease, border-color 300ms ease, box-shadow 300ms ease"
  );
};
