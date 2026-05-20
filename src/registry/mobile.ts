import type { Template } from "../types.js";
import { dlx, installStep } from "../pm.js";

export const MOBILE_TEMPLATES: Template[] = [
  {
    id: "expo-ts",
    category: "mobile",
    name: "Expo (React Native)",
    description: "Expo SDK 52 · TypeScript · File routing · Cross-platform",
    badge: "iOS/Android",
    docs: "https://expo.dev",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Expo project",
        ...dlx(
          pm,
          "create-expo-app@latest",
          projectName,
          "--template",
          "blank-typescript",
        ),
      },
      installStep(pm),
    ],
  },

  {
    id: "expo-router",
    category: "mobile",
    name: "Expo Router",
    description:
      "Expo SDK 52 · File-based routing · TypeScript · Tabs template",
    badge: "iOS/Android/Web",
    docs: "https://expo.github.io/router",
    interactive: true,
    steps: ({ projectName, pm }) => [
      {
        label: "Creating Expo Router project (interactive)",
        ...dlx(pm, "create-expo-app@latest", projectName),
      },
    ],
  },

  {
    id: "react-native-cli",
    category: "mobile",
    name: "React Native CLI",
    description: "Bare React Native · TypeScript · Full native control",
    badge: "iOS/Android",
    docs: "https://reactnative.dev",
    steps: ({ projectName, pm }) => [
      {
        label: "Creating React Native project",
        ...dlx(pm, "@react-native-community/cli@latest", "init", projectName),
      },
    ],
  },
];
