(function (root) {
  const STOP = new Set([
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "is",
    "was", "were", "be", "by", "at", "from", "that", "this", "it", "as", "are",
    "what", "who", "when", "where", "why", "how", "did", "does", "do", "about",
    "which", "into", "their", "them", "his", "her", "its",
  ]);

  function paragraphsFromBody(body) {
    return String(body || "")
      .split(/\n\s*\n/)
      .map((block) => block.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 60)
      .map((text, index) => ({ id: `p${index + 1}`, text: text.slice(0, 1200) }));
  }

  function wordCount(paragraphs) {
    return paragraphs.reduce((total, paragraph) => total + paragraph.text.trim().split(/\s+/).filter(Boolean).length, 0);
  }

  function tokenize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 2 && !STOP.has(term));
  }

  function scoreParagraph(text, terms) {
    if (!terms.length) return 0;
    const hay = text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (!hay.includes(term)) continue;
      score += 2 + Math.min(hay.split(term).length - 1, 4);
    }
    return score;
  }

  function localAnswer(question, paragraphs) {
    const broad = /summar|overview|what is this|main point|about this/i.test(question);
    const terms = tokenize(question);
    const ranked = [...paragraphs]
      .map((paragraph) => ({ paragraph, score: scoreParagraph(paragraph.text, terms) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.paragraph);

    if (!broad && ranked.length === 0) {
      return {
        answer: "That isn’t in this document. Try a name, a date, or a claim that appears in the text.",
        citations: [],
        mode: "passages",
      };
    }

    const chosen = (broad ? paragraphs : ranked).slice(0, broad ? 3 : 2);
    const joined = chosen.map((paragraph) => paragraph.text).join(" ");
    const clipped = joined.length > 520 ? `${joined.slice(0, 500).trim()}…` : joined;
    return {
      answer: broad ? `The document opens like this: ${clipped}` : clipped,
      citations: chosen.map((paragraph) => paragraph.id),
      mode: "passages",
    };
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  root.VellumGround = { paragraphsFromBody, wordCount, localAnswer, escapeRegExp };
})(window);
