<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

## BKIT Integration

This project uses BKIT as an AI development methodology and tooling system.
BKIT is not bundled into the runtime application.
It is located in `tools/bkit` as a git submodule.

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1B4P7vNrcMNxVaQTfNh4bHom3_KbHxM5f

## Release Docs

- Latest security patch status: `docs/04-report/release_security_patch_status_20260330.md`
- Latest final security addendum: `docs/04-report/release_security_final_addendum_20260330.md`

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
