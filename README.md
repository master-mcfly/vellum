# Vellum

A desktop reader. Open a document, then ask questions that stay inside it.

Vellum ships with three pieces to try — an essay, field notes, and a set of minutes. Paste your own text onto the shelf. Answers cite the paragraph they came from, and those lines light up in the reading.

Without an xAI key, Vellum still works offline: it returns the closest passages in the document. With a key, the desktop app asks Grok and keeps the key on this machine.

## Run

```bash
npm install
npm start
```

That opens an Electron window. No separate build step.

## Optional: Grok answers

1. Open **Key** in the window.
2. Paste an [xAI API key](https://console.x.ai/).
3. It is stored with Electron’s safe storage when the OS allows it, in the app’s user-data folder. It is not written into the repo.

You can also start the app with `XAI_API_KEY` set in the environment. A key saved in the app takes priority.

## What’s in the box

- Read with a serif text column, find-in-document, and type size.
- Ask a question. Cited paragraphs are numbered so you can jump back to them.
- Add or remove your own documents. They stay in local storage for this installation.
- The three sample documents are always on the shelf.
