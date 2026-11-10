/* Docs search for every /docs/ page, answered by Helpdock.

   Helpdock (helpdock.flisk.si) reads the Markdown in flisk-sh/flisk docs/
   and serves it as a public, read-only MCP server. This script calls that
   server's search_docs tool straight from the browser, so the site searches
   every page of the repository docs, not only the pages built here, and uses
   the same endpoint an AI assistant would.

   The button it wires up is a plain link to Helpdock, so search still works
   when this script does not run.

   Under the results, "Write an answer (beta)" asks Helpdock's /answer for a
   short answer written by a model from those same passages, on request only.
   Helpdock drops any line that quotes a command the passages do not show.
   When it has no answer, the reader gets Discord and a GitHub issue instead;
   when it is off or busy, the passages stay as they are. */
(function (root) {
  var HELPDOCK = 'https://helpdock.flisk.si/flisk-sh/flisk/tree/main/docs/';
  var MCP_URL = HELPDOCK + 'mcp';
  var ANSWER_URL = HELPDOCK + 'answer';
  var DISCORD = 'https://discord.gg/qMu5Xn8Kaq';
  var NEW_ISSUE = 'https://github.com/flisk-sh/flisk/issues/new';
  var LIMIT = 12;
  var MAX_PER_PAGE = 2;
  var EXCERPT_CHARS = 200;
  var PASSAGE_CHARS = 600;
  var PROMPT_HITS = 4;

  // Markdown passage -> one line of plain text for a result row.
  function excerpt(markdown, max) {
    var text = String(markdown || '')
      .replace(/```[a-z]*\n?/gi, ' ')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[*`>#|]/g, '')
      .replace(/:?-{3,}:?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    var limit = max || EXCERPT_CHARS;
    if (text.length <= limit) return text;
    var cut = text.slice(0, limit);
    var space = cut.lastIndexOf(' ');
    return (space > limit * 0.6 ? cut.slice(0, space) : cut) + '...';
  }

  // The JSON-RPC body of one search_docs call.
  function searchRequest(query, id, limit) {
    return {
      jsonrpc: '2.0',
      id: id || 1,
      method: 'tools/call',
      params: { name: 'search_docs', arguments: { query: query, limit: limit || LIMIT } },
    };
  }

  function httpsOr(value, fallback) {
    return typeof value === 'string' && /^https:\/\//.test(value) ? value : fallback;
  }

  // MCP tools/call response -> [{ section, title, source, text, url }].
  // Throws when the server answered with an error, so the caller can say so.
  function parseHits(response) {
    if (!response || response.error) {
      throw new Error((response && response.error && response.error.message) || 'no response');
    }
    var result = response.result || {};
    var first = (result.content || [])[0];
    if (result.isError || !first || typeof first.text !== 'string') {
      throw new Error((first && first.text) || 'empty response');
    }
    var payload = JSON.parse(first.text);
    // At most two sections of one page, so a question shows several pages instead of one page's sections.
    var perPage = {};
    var hits = (payload.hits || []).filter(function (hit) {
      var key = hit.source || hit.url || '';
      perPage[key] = (perPage[key] || 0) + 1;
      return perPage[key] <= MAX_PER_PAGE;
    });
    return hits.map(function (hit) {
      return {
        section: hit.section || hit.title || hit.source || '',
        title: hit.title || '',
        source: hit.source || '',
        text: excerpt(hit.text),
        passage: String(hit.text || '').slice(0, PASSAGE_CHARS),
        // The page in Helpdock, at its heading, keeps the reader in a docs view with navigation; the file on GitHub
        // is the fallback.
        url: httpsOr(hit.page, httpsOr(hit.url, HELPDOCK)),
        github: httpsOr(hit.url, ''),
      };
    });
  }

  // The question plus the passages found, for the reader's own AI.
  function aiPrompt(query, hits) {
    var lines = [
      'Answer this question about Flisk (https://flisk.sh), a CLI that runs a local development stack.',
      'Use only the passages from the Flisk docs below and cite them as [n]. Say so if they do not answer it.',
      '',
      'Question: ' + query,
      '',
    ];
    (hits || []).slice(0, PROMPT_HITS).forEach(function (hit, i) {
      lines.push('[' + (i + 1) + '] ' + hit.section + ' (' + (hit.github || hit.url) + ')');
      lines.push(hit.passage || hit.text || '');
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  // Helpdock's /answer response, by HTTP status and body, as what the page shows:
  // answer, not-covered (offer Discord and an issue), rate (wait), off (AI answers are switched off) or down.
  function parseAnswer(status, json) {
    if (status === 429) return { kind: 'rate' };
    if (status === 404) return { kind: 'off' };
    if (status !== 200 || !json || json.available === false) return { kind: 'down' };
    var sources = (json.sources || []).map(function (src, i) {
      return {
        n: Number(src.n) || i + 1,
        label: src.section || src.title || src.source || '',
        url: httpsOr(src.page, httpsOr(src.url, HELPDOCK)),
      };
    });
    if (typeof json.answer !== 'string' || !json.answer.trim()) return { kind: 'not-covered', sources: sources };
    return { kind: 'answer', text: json.answer.trim(), sources: sources };
  }

  // One line of the answer as parts: text, inline code, and citations ([1], [1, 3]). Bold markers are dropped.
  function inlineParts(line) {
    var parts = [];
    var re = /`([^`]+)`|\[(\d+(?:\s*,\s*\d+)*)\]/g;
    var last = 0;
    var m;
    var push = function (text) {
      text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
      if (text) parts.push({ type: 'text', value: text });
    };
    while ((m = re.exec(line))) {
      push(line.slice(last, m.index));
      if (m[1] !== undefined) parts.push({ type: 'code', value: m[1] });
      else
        m[2].split(',').forEach(function (n) {
          parts.push({ type: 'cite', value: Number(n.trim()) });
        });
      last = re.lastIndex;
    }
    push(line.slice(last));
    return parts;
  }

  // The answer as blocks to build with DOM nodes (never as HTML): paragraphs, lists and code blocks.
  function answerBlocks(text) {
    var blocks = [];
    var lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (/^\s*(```|~~~)/.test(line)) {
        var code = [];
        for (i++; i < lines.length && !/^\s*(```|~~~)/.test(lines[i]); i++) code.push(lines[i]);
        blocks.push({ type: 'pre', code: code.join('\n') });
        continue;
      }
      var bullet = /^\s*[-*]\s+(.*)$/.exec(line);
      var numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      var item = bullet || numbered;
      if (item) {
        var kind = bullet ? 'ul' : 'ol';
        var prev = blocks[blocks.length - 1];
        if (!prev || prev.type !== kind) blocks.push((prev = { type: kind, items: [] }));
        prev.items.push(inlineParts(item[1]));
        continue;
      }
      if (line.trim()) blocks.push({ type: 'p', parts: inlineParts(line.trim()) });
    }
    return blocks;
  }

  // Where a question the docs do not answer goes: the community, or an issue with the question filled in.
  function handoffLinks(question) {
    var q = String(question || '').trim().slice(0, 200);
    return {
      discord: DISCORD,
      issue:
        NEW_ISSUE +
        '?title=' +
        encodeURIComponent('Docs question: ' + q.slice(0, 120)) +
        '&body=' +
        encodeURIComponent('Asked in the docs search on flisk.sh/docs:\n\n> ' + q + '\n\nThe docs had no answer.'),
    };
  }

  var api = {
    aiPrompt: aiPrompt,
    excerpt: excerpt,
    searchRequest: searchRequest,
    parseHits: parseHits,
    parseAnswer: parseAnswer,
    inlineParts: inlineParts,
    answerBlocks: answerBlocks,
    handoffLinks: handoffLinks,
    MCP_URL: MCP_URL,
    ANSWER_URL: ANSWER_URL,
    HELPDOCK: HELPDOCK,
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    return;
  }

  var doc = root.document;
  if (!doc || !root.fetch) return;

  // Helpdock sleeps when nobody uses it and builds a repository's search index on the first question. Wake it
  // and build the index before the reader needs it: when a docs page opens, and when a pointer, a finger or
  // the keyboard reaches any link to the docs. One small search, at most once every ten minutes per browser.
  var WARM_KEY = 'flisk-docs-warm';
  var WARM_EVERY_MS = 10 * 60 * 1000;
  function prewarm() {
    var now = Date.now();
    try {
      if (now - Number(root.sessionStorage.getItem(WARM_KEY) || 0) < WARM_EVERY_MS) return;
      root.sessionStorage.setItem(WARM_KEY, String(now));
    } catch (e) {
      if (prewarm.done) return;
    }
    prewarm.done = true;
    root
      .fetch(MCP_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
        body: JSON.stringify(searchRequest('flisk', 0, 1)),
        keepalive: true,
      })
      .catch(function () {});
  }
  function isDocsLink(node) {
    var link = node && node.closest ? node.closest('a[href]') : null;
    return !!link && /\/docs(\/|$)/.test(link.getAttribute('href'));
  }
  ['pointerover', 'focusin', 'touchstart'].forEach(function (type) {
    doc.addEventListener(
      type,
      function (event) {
        if (isDocsLink(event.target)) prewarm();
      },
      { passive: true }
    );
  });
  if (doc.querySelector('.aw-docs-body')) prewarm();

  var opener = doc && doc.querySelector('[data-docs-search]');
  var askForm = doc && doc.querySelector('[data-docs-ask]');
  if ((!opener && !askForm) || typeof root.HTMLDialogElement === 'undefined') return;

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  var dialog = el('dialog', 'aw-docs-search');
  dialog.setAttribute('aria-label', 'Search the docs');

  var form = el('form', 'aw-docs-search-form');
  form.setAttribute('role', 'search');
  var input = el('input', 'aw-docs-search-input');
  input.type = 'search';
  input.placeholder = 'Search every page of the Flisk docs';
  input.setAttribute('aria-label', 'Search the docs');
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.maxLength = 200;
  var close = el('button', 'aw-docs-search-close', 'Esc');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close search');
  form.appendChild(input);
  form.appendChild(close);

  var status = el('p', 'aw-docs-search-status');
  status.setAttribute('role', 'status');
  var list = el('ol', 'aw-docs-search-results');

  var foot = el('div', 'aw-docs-search-foot');
  var browse = el('a', '', 'Browse all docs in Helpdock');
  browse.href = HELPDOCK;
  browse.target = '_blank';
  browse.rel = 'noopener';
  var copy = el('button', 'aw-docs-search-copy', 'Copy MCP URL for your AI');
  copy.type = 'button';
  // Shown once a search has results: the question and the passages, handed to the reader's own AI.
  var hand = el('span', 'aw-docs-search-ai');
  hand.hidden = true;
  hand.appendChild(el('span', '', 'Ask your AI:'));
  var AI_TARGETS = [
    ['Claude', 'https://claude.ai/new?q='],
    ['ChatGPT', 'https://chatgpt.com/?q='],
  ];
  var aiLinks = AI_TARGETS.map(function (target) {
    var link = el('a', '', target[0]);
    link.target = '_blank';
    link.rel = 'noopener';
    hand.appendChild(link);
    return link;
  });
  foot.appendChild(hand);
  foot.appendChild(browse);
  foot.appendChild(copy);

  // The AI answer, on request, between the status line and the results.
  var ai = el('div', 'aw-docs-ai');
  ai.hidden = true;
  var aiButton = el('button', 'aw-docs-ai-button', 'Write an answer from these passages (beta)');
  aiButton.type = 'button';
  var aiOut = el('div', 'aw-docs-ai-out');
  aiOut.setAttribute('aria-live', 'polite');
  ai.appendChild(aiButton);
  ai.appendChild(aiOut);

  dialog.appendChild(form);
  dialog.appendChild(status);
  dialog.appendChild(ai);
  dialog.appendChild(list);
  dialog.appendChild(foot);
  doc.body.appendChild(dialog);

  var IDLE = 'Type a question or an error message. Results come from the Markdown in flisk-sh/flisk.';
  var timer = null;
  var latest = 0;
  var controller = null;

  function setStatus(text) {
    status.textContent = text;
    status.hidden = !text;
  }

  // AI answers: shown only once Helpdock says they are on (GET /answer, always 200 so no console error). Asked once per
  // page, on the first results; switched off for the rest of the visit if a later answer says they are off.
  var aiOff = false;
  var aiReady = false;
  var aiProbe = null;
  var aiRun = 0;
  var aiQuery = '';
  var aiHits = 0;

  function probeAi() {
    if (aiProbe) return;
    aiProbe = root
      .fetch(ANSWER_URL)
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (json) {
        aiReady = Boolean(json && json.available === true);
      })
      .catch(function () {
        aiReady = false;
      })
      .then(function () {
        ai.hidden = !aiReady || aiOff || !aiHits;
      });
  }

  function render(hits, query) {
    list.textContent = '';
    hand.hidden = !hits.length;
    aiRun++;
    aiQuery = query;
    aiHits = hits.length;
    aiOut.textContent = '';
    aiButton.hidden = false;
    aiButton.disabled = false;
    ai.hidden = !aiReady || aiOff || !hits.length;
    if (hits.length) probeAi();
    if (hits.length) {
      var prompt = encodeURIComponent(aiPrompt(query, hits));
      aiLinks.forEach(function (link, i) {
        link.href = AI_TARGETS[i][1] + prompt;
      });
    }
    hits.forEach(function (hit) {
      var item = el('li');
      var link = el('a', 'aw-docs-search-hit');
      link.href = hit.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.appendChild(el('strong', '', hit.section));
      if (hit.text) link.appendChild(el('span', 'aw-docs-search-text', hit.text));
      link.appendChild(el('span', 'aw-docs-search-source', hit.source));
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  function search(query) {
    var run = ++latest;
    if (controller) controller.abort();
    controller = root.AbortController ? new root.AbortController() : null;
    setStatus('Searching...');
    // Helpdock sleeps when idle; say so if the first answer is slow.
    var slow = setTimeout(function () {
      if (run === latest) setStatus('Helpdock is waking up. This can take up to a minute.');
    }, 4000);

    root.fetch(MCP_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify(searchRequest(query, run)),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        if (res.status === 429) throw new Error('rate');
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (run !== latest) return;
        var hits = parseHits(json);
        render(hits, query);
        setStatus(hits.length ? '' : 'Nothing found for "' + query + '". Try fewer words.');
      })
      .catch(function (err) {
        if (run !== latest || (err && err.name === 'AbortError')) return;
        render([], query);
        setStatus(
          err && err.message === 'rate'
            ? 'Too many searches from this address. Wait a minute and try again.'
            : 'Search did not answer. Open the docs in Helpdock with the link below.'
        );
      })
      .then(function () {
        clearTimeout(slow);
      });
  }

  function aiNote(text, className) {
    aiOut.textContent = '';
    aiOut.appendChild(el('p', className || 'aw-docs-ai-note', text));
  }

  function appendParts(parent, parts, sources) {
    parts.forEach(function (part) {
      if (part.type === 'code') parent.appendChild(el('code', '', part.value));
      else if (part.type === 'cite') {
        var src = sources[part.value - 1];
        if (!src) return;
        var cite = el('a', 'aw-docs-ai-cite', '[' + part.value + ']');
        cite.href = src.url;
        cite.target = '_blank';
        cite.rel = 'noopener';
        cite.title = src.label;
        parent.appendChild(cite);
      } else parent.appendChild(doc.createTextNode(part.value));
    });
  }

  function showAnswer(result) {
    aiOut.textContent = '';
    aiOut.appendChild(el('p', 'aw-docs-ai-label', "AI answer (beta), written by Wolf's base model from the passages below. Check it against them."));
    answerBlocks(result.text).forEach(function (block) {
      if (block.type === 'pre') {
        var pre = el('pre');
        pre.appendChild(el('code', '', block.code));
        aiOut.appendChild(pre);
      } else if (block.type === 'p') {
        var p = el('p');
        appendParts(p, block.parts, result.sources);
        aiOut.appendChild(p);
      } else {
        var listEl = el(block.type);
        block.items.forEach(function (parts) {
          var li = el('li');
          appendParts(li, parts, result.sources);
          listEl.appendChild(li);
        });
        aiOut.appendChild(listEl);
      }
    });
  }

  function showHandoff(question) {
    var links = handoffLinks(question);
    aiNote('The docs do not cover this yet. Ask the people who build Flisk:');
    var row = el('p', 'aw-docs-ai-handoff');
    [
      ['Ask on Discord', links.discord],
      ['Open an issue', links.issue],
    ].forEach(function (pair) {
      var a = el('a', '', pair[0]);
      a.href = pair[1];
      a.target = '_blank';
      a.rel = 'noopener';
      row.appendChild(a);
    });
    aiOut.appendChild(row);
  }

  aiButton.addEventListener('click', function () {
    var run = ++aiRun;
    var question = aiQuery;
    aiButton.disabled = true;
    aiNote('Writing an answer from these passages...');
    root
      .fetch(ANSWER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: question }),
      })
      .then(function (res) {
        return res.json().then(
          function (json) {
            return parseAnswer(res.status, json);
          },
          function () {
            return parseAnswer(res.status, null);
          }
        );
      })
      .catch(function () {
        return { kind: 'down' };
      })
      .then(function (result) {
        if (run !== aiRun) return;
        if (root.plausible) root.plausible('Docs AI answer', { props: { result: result.kind } });
        aiButton.hidden = result.kind !== 'rate';
        aiButton.disabled = false;
        if (result.kind === 'answer') showAnswer(result);
        else if (result.kind === 'not-covered') showHandoff(question);
        else if (result.kind === 'rate') aiNote('Too many AI answers from this address. Wait a while and try again.');
        else if (result.kind === 'off') {
          aiOff = true;
          ai.hidden = true;
        } else aiNote('The AI answer is not available right now. The passages below still answer.');
      });
  });

  function onInput() {
    clearTimeout(timer);
    var query = input.value.trim();
    if (query.length < 2) {
      latest++;
      if (controller) controller.abort();
      render([], '');
      setStatus(IDLE);
      return;
    }
    timer = setTimeout(function () {
      search(query);
    }, 250);
  }

  // With a question, the dialog opens already searching for it.
  function open(question) {
    if (!dialog.open) {
      dialog.showModal();
      if (root.plausible) root.plausible('Docs search open');
    }
    if (question) {
      input.value = question;
      clearTimeout(timer);
      search(question);
    } else if (!input.value.trim()) {
      setStatus(IDLE);
    }
    input.focus();
    if (!question) input.select();
  }

  input.addEventListener('input', onInput);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var first = list.querySelector('a');
    if (first) first.click();
  });
  close.addEventListener('click', function () {
    dialog.close();
  });
  // A click on the backdrop lands on the dialog element itself.
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) dialog.close();
  });
  copy.addEventListener('click', function () {
    var done = function () {
      copy.textContent = 'Copied ' + MCP_URL;
    };
    if (root.navigator.clipboard) root.navigator.clipboard.writeText(MCP_URL).then(done, function () {});
  });

  if (opener) {
    opener.addEventListener('click', function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      open();
    });
  }

  // The Ask bar on the docs overview: its box and its ready-made questions open the dialog.
  if (askForm) {
    var askInput = askForm.querySelector('input');
    askForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var question = askInput.value.trim();
      open(question.length >= 2 ? question : '');
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-docs-ask-q]'), function (chip) {
      chip.addEventListener('click', function (event) {
        event.preventDefault();
        askInput.value = chip.textContent.trim();
        open(askInput.value);
      });
    });
  }
  doc.addEventListener('keydown', function (event) {
    var target = event.target;
    var typing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    var slash = event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey;
    var palette = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (slash || palette) {
      event.preventDefault();
      open();
    }
  });
})(typeof window !== 'undefined' ? window : this);
