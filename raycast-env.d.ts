/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Google API Key - Your Google API Key for Gemini */
  "apiKey": string,
  /** Model - Which model Gemini for Raycast uses by default (unless overriden by individual commands). */
  "defaultModel": "gemini-1.5-pro-latest" | "gemini-1.5-flash-latest" | "gemini-2.0-flash-exp" | "gemini-exp-1206" | "gemini-2.0-pro-exp-02-05" | "gemini-2.0-flash-thinking-exp-1219" | "learnlm-1.5-pro-experimental" | "gemini-2.5-pro-preview-03-25",
  /** System Prompt - Custom system prompt for Gemini */
  "systemPrompt"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
}

