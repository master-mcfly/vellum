(function () {
  const { paragraphsFromBody, wordCount, localAnswer, escapeRegExp } = window.VellumGround;
  const USER_KEY = "vellum.user-docs.v1";
  const THREAD_KEY = "vellum.threads.v1";

  const state = {
    userDocs: loadUserDocs(),
    activeId: "river",
    threads: loadThreads(),
    citations: [],
    find: "",
    shelfQuery: "",
    size: "md",
    busy: false,
    hasKey: false,
  };

  const shelf = document.getElementById("shelf");
  const prose = document.getElementById("prose");
  const thread = document.getElementById("thread");
  const scroll = document.getElementById("scroll");

  function loadUserDocs() {
    try {
      const parsed = JSON.parse(localStorage.getItem(USER_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((item) => {
        const paragraphs = paragraphsFromBody(item.body || "");
        if (!item.id || paragraphs.length === 0) return [];
        return [{
          id: item.id,
          title: String(item.title || "Untitled").slice(0, 120),
          author: String(item.author || "You").slice(0, 80),
          kicker: "Your document",
          prompts: ["Summarize this", "What names appear?", "What dates or numbers matter?"],
          paragraphs,
          origin: "yours",
        }];
      });
    } catch {
      return [];
    }
  }

  function loadThreads() {
    try {
      const parsed = JSON.parse(localStorage.getItem(THREAD_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function docs() {
    return window.VELLUM_SAMPLES.concat(state.userDocs);
  }

  function active() {
    return docs().find((doc) => doc.id === state.activeId) || docs()[0];
  }

  function persist() {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(state.userDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        author: doc.author,
        body: doc.paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
      }))),
    );
    localStorage.setItem(THREAD_KEY, JSON.stringify(state.threads));
  }

  function highlighted(text) {
    const needle = state.find.trim();
    if (needle.length < 2) return document.createTextNode(text);
    const frag = document.createDocumentFragment();
    const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "ig"));
    for (const part of parts) {
      if (part.toLowerCase() === needle.toLowerCase()) {
        const mark = document.createElement("span");
        mark.className = "find-hit";
        mark.textContent = part;
        frag.append(mark);
      } else {
        frag.append(document.createTextNode(part));
      }
    }
    return frag;
  }

  function renderShelf() {
    shelf.replaceChildren();
    const query = state.shelfQuery.trim().toLowerCase();
    const visible = docs().filter((doc) => `${doc.title} ${doc.author} ${doc.kicker}`.toLowerCase().includes(query));
    if (visible.length === 0) {
      const empty = document.createElement("li");
      empty.className = "hint";
      empty.textContent = "Nothing on the shelf matches.";
      shelf.append(empty);
      return;
    }
    for (const doc of visible) {
      const item = document.createElement("li");
      item.className = "doc-row";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `doc-btn${doc.id === active().id ? " active" : ""}`;
      button.innerHTML = `<span class="kicker"></span><span class="doc-title"></span><span class="doc-author"></span>`;
      button.querySelector(".kicker").textContent = doc.kicker;
      button.querySelector(".doc-title").textContent = doc.title;
      button.querySelector(".doc-author").textContent = doc.author;
      button.addEventListener("click", () => openDoc(doc.id));
      item.append(button);
      if (doc.origin === "yours") {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "icon-btn";
        remove.setAttribute("aria-label", `Remove ${doc.title}`);
        remove.textContent = "×";
        remove.addEventListener("click", () => {
          state.userDocs = state.userDocs.filter((itemDoc) => itemDoc.id !== doc.id);
          delete state.threads[doc.id];
          if (state.activeId === doc.id) state.activeId = "river";
          persist();
          render();
        });
        item.append(remove);
      }
      shelf.append(item);
    }
  }

  function renderReader() {
    const doc = active();
    document.getElementById("doc-name").textContent = doc.title;
    document.getElementById("kicker").textContent = doc.kicker;
    document.getElementById("title").textContent = doc.title;
    const words = wordCount(doc.paragraphs);
    const minutes = Math.max(1, Math.round(words / 220));
    document.getElementById("meta").textContent = `${doc.author} · ${minutes} min · ${words} words`;
    prose.className = `prose ${state.size}`;
    prose.replaceChildren();
    doc.paragraphs.forEach((paragraph, index) => {
      const p = document.createElement("p");
      p.dataset.pid = paragraph.id;
      if (state.citations.includes(paragraph.id)) p.className = "cite";
      const num = document.createElement("span");
      num.className = "num";
      num.textContent = String(index + 1);
      p.append(num, highlighted(paragraph.text));
      prose.append(p);
    });
  }

  function renderThread() {
    const doc = active();
    const messages = state.threads[doc.id] || [];
    thread.replaceChildren();
    document.getElementById("clear-btn").classList.toggle("hidden", messages.length === 0);
    if (messages.length === 0) {
      const intro = document.createElement("div");
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent = state.hasKey
        ? "Ask about a person, a number, or what the piece is arguing. Cited lines light up in the reading."
        : "No Grok key yet, so answers are the closest passages. Add a key if you want a written answer.";
      intro.append(hint);
      const prompts = document.createElement("div");
      prompts.className = "prompts";
      for (const prompt of doc.prompts) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "prompt";
        button.textContent = prompt;
        button.addEventListener("click", () => ask(prompt));
        prompts.append(button);
      }
      intro.append(prompts);
      thread.append(intro);
      return;
    }
    for (const message of messages) {
      if (message.role === "user") {
        const bubble = document.createElement("div");
        bubble.className = "bubble-user";
        bubble.textContent = message.text;
        thread.append(bubble);
        continue;
      }
      const block = document.createElement("div");
      block.className = "bubble-ai";
      const mode = document.createElement("p");
      mode.className = "mode";
      mode.textContent = message.mode === "grok" ? "From the document" : "Closest passages";
      const text = document.createElement("p");
      text.textContent = message.text;
      block.append(mode, text);
      if (message.citations?.length) {
        const cites = document.createElement("div");
        cites.className = "cites";
        for (const id of message.citations) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "cite-btn";
          button.textContent = `¶ ${id.replace("p", "")}`;
          button.addEventListener("click", () => {
            state.citations = message.citations;
            renderReader();
            const node = prose.querySelector(`[data-pid="${id}"]`);
            node?.scrollIntoView({ block: "center" });
          });
          cites.append(button);
        }
        block.append(cites);
      }
      thread.append(block);
    }
    if (state.busy) {
      const waiting = document.createElement("p");
      waiting.className = "hint";
      waiting.textContent = "Reading the page…";
      thread.append(waiting);
    }
    thread.scrollTop = thread.scrollHeight;
  }

  function render() {
    renderShelf();
    renderReader();
    renderThread();
  }

  function openDoc(id) {
    state.activeId = id;
    state.citations = [];
    state.find = "";
    document.getElementById("find").value = "";
    scroll.scrollTop = 0;
    document.getElementById("meter").style.width = "0%";
    render();
  }

  async function ask(question) {
    const doc = active();
    const clean = question.trim();
    if (!doc || state.busy || clean.length < 2) return;
    const history = state.threads[doc.id] || [];
    history.push({ role: "user", text: clean });
    state.threads[doc.id] = history.slice(-40);
    state.busy = true;
    document.getElementById("draft").value = "";
    persist();
    render();

    let answer = localAnswer(clean, doc.paragraphs);
    if (window.vellum?.ask) {
      try {
        const remote = await window.vellum.ask({
          question: clean,
          title: doc.title,
          paragraphs: doc.paragraphs,
        });
        if (remote?.ok) {
          answer = { answer: remote.answer, citations: remote.citations || [], mode: "grok" };
        }
      } catch {
        answer = localAnswer(clean, doc.paragraphs);
      }
    }
    const next = state.threads[doc.id] || [];
    next.push({
      role: "assistant",
      text: answer.answer,
      citations: answer.citations,
      mode: answer.mode,
    });
    state.threads[doc.id] = next.slice(-40);
    state.citations = answer.citations;
    state.busy = false;
    persist();
    render();
  }

  document.getElementById("shelf-search").addEventListener("input", (event) => {
    state.shelfQuery = event.target.value;
    renderShelf();
  });

  document.getElementById("find").addEventListener("input", (event) => {
    state.find = event.target.value;
    renderReader();
  });

  scroll.addEventListener("scroll", () => {
    const range = scroll.scrollHeight - scroll.clientHeight;
    const progress = range <= 0 ? 0 : scroll.scrollTop / range;
    document.getElementById("meter").style.width = `${Math.round(progress * 100)}%`;
  });

  document.getElementById("size-btn").addEventListener("click", () => {
    state.size = state.size === "sm" ? "md" : state.size === "md" ? "lg" : "sm";
    renderReader();
  });

  document.getElementById("composer").addEventListener("submit", (event) => {
    event.preventDefault();
    ask(document.getElementById("draft").value);
  });

  document.getElementById("draft").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ask(event.target.value);
    }
  });

  document.getElementById("clear-btn").addEventListener("click", () => {
    state.threads[active().id] = [];
    state.citations = [];
    persist();
    render();
  });

  const addModal = document.getElementById("add-modal");
  document.getElementById("add-btn").addEventListener("click", () => addModal.classList.remove("hidden"));
  document.getElementById("add-close").addEventListener("click", () => addModal.classList.add("hidden"));

  document.getElementById("save-doc").addEventListener("click", () => {
    const title = document.getElementById("new-title").value.trim();
    const author = document.getElementById("new-author").value.trim();
    const body = document.getElementById("new-body").value;
    const error = document.getElementById("add-error");
    const paragraphs = paragraphsFromBody(body);
    if (title.length < 2) {
      error.textContent = "Give the document a title.";
      return;
    }
    if (paragraphs.length === 0 || body.trim().length < 40) {
      error.textContent = "Paste at least a short paragraph.";
      return;
    }
    const doc = {
      id: `y-${Date.now().toString(36)}`,
      title: title.slice(0, 120),
      author: author.slice(0, 80) || "You",
      kicker: "Your document",
      prompts: ["Summarize this", "What names appear?", "What dates or numbers matter?"],
      paragraphs,
      origin: "yours",
    };
    state.userDocs.unshift(doc);
    state.activeId = doc.id;
    persist();
    addModal.classList.add("hidden");
    document.getElementById("new-title").value = "";
    document.getElementById("new-author").value = "";
    document.getElementById("new-body").value = "";
    error.textContent = "";
    render();
  });

  const keyModal = document.getElementById("key-modal");
  document.getElementById("key-btn").addEventListener("click", () => keyModal.classList.remove("hidden"));
  document.getElementById("key-close").addEventListener("click", () => keyModal.classList.add("hidden"));
  document.getElementById("save-key").addEventListener("click", async () => {
    const error = document.getElementById("key-error");
    error.textContent = "";
    if (!window.vellum?.setKey) {
      error.textContent = "Keys can only be saved in the desktop app.";
      return;
    }
    const result = await window.vellum.setKey(document.getElementById("key-input").value);
    if (!result?.ok) {
      error.textContent = result?.error || "Could not save that key.";
      return;
    }
    state.hasKey = Boolean(result.hasKey);
    document.getElementById("key-input").value = "";
    document.getElementById("key-status").textContent = state.hasKey
      ? "A key is saved on this computer. Questions go to Grok and still have to stay inside the document."
      : "Without a key, Vellum answers from the closest passages. Nothing is sent off this machine.";
    keyModal.classList.add("hidden");
    renderThread();
  });

  render();

  if (window.vellum?.keyStatus) {
    window.vellum.keyStatus().then((status) => {
      state.hasKey = Boolean(status?.hasKey);
      const note = document.getElementById("key-status");
      if (state.hasKey) {
        note.textContent = "A key is saved on this computer. Questions go to Grok and still have to stay inside the document.";
      }
      renderThread();
    }).catch(() => {});
  }
})();
