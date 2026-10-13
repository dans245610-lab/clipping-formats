(function () {
  "use strict";

  var STORAGE_KEY = "clipFormats.edits.v1";
  var EDIT_STYLE_PLACEHOLDER = "Edit style not set yet, tap Edit to fill it in.";
  var GENERIC_PLACEHOLDER = "Not set yet, tap Edit to fill it in.";

  var LABELS = {
    aspect: "Aspect",
    titleCard: "Title card",
    captions: "Captions",
    captionText: "Caption text",
    content: "Content",
    context: "Context",
    source: "Source material",
    editStyle: "Edit style",
    posting: "Posting rule",
    distribution: "Distribution"
  };

  // Defaults come straight from BRIEF.md. An empty value renders as a placeholder.
  var DEFAULTS = [
    {
      id: "clean-virginia",
      name: "Clean Virginia",
      styleName: "ketchum",
      status: "Confirmed",
      fields: [
        { key: "aspect", value: "9:16 vertical" },
        { key: "titleCard", value: "White WATCH title card up top" },
        { key: "captions", value: "Burned-in captions, caption bubbles hugged close to the text and centered horizontally" },
        { key: "source", value: "Best hearing beats, news clips, hearing footage" },
        { key: "posting", value: "NEVER auto-publish. Return finished clips to Will, he posts them himself." }
      ]
    },
    {
      id: "willztalks",
      name: "WillzTalks",
      status: "Confirmed",
      fields: [
        { key: "aspect", value: "9:16 vertical reels" },
        { key: "captions", value: "Burned-in English captions" },
        { key: "captionText", value: "Verbatim Instagram caption, plain English, no rewrites" },
        { key: "content", value: "Political commentary" },
        { key: "distribution", value: "Instagram, TikTok, RedNote, Bilibili, Substack, UpScrolled, Bluesky" }
      ]
    },
    {
      id: "ffrf",
      name: "FFRF",
      status: "Partial",
      fields: [
        { key: "aspect", value: "" },
        { key: "titleCard", value: "" },
        { key: "captions", value: "" },
        { key: "source", value: "Long-form FFRF YouTube episodes and press releases. Will pulls clips from long-form, he produces the videos." },
        { key: "editStyle", value: "", placeholder: EDIT_STYLE_PLACEHOLDER },
        { key: "posting", value: "Scouting is proposals only, never auto-produce." },
        { key: "distribution", value: "" }
      ]
    },
    {
      id: "merger-coalition",
      name: "Merger Coalition",
      status: "Unknown",
      fields: [
        { key: "context", value: "Content opposing the Dominion-NextEra merger." },
        { key: "editStyle", value: "", placeholder: EDIT_STYLE_PLACEHOLDER },
        { key: "aspect", value: "" },
        { key: "titleCard", value: "" },
        { key: "captions", value: "" },
        { key: "source", value: "" },
        { key: "posting", value: "" },
        { key: "distribution", value: "" }
      ]
    }
  ];

  // ---------- storage ----------

  function loadEdits() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveEdits(edits) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearEdits() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* storage unavailable */ }
  }

  var edits = loadEdits();

  function getValue(format, field) {
    var saved = edits[format.id];
    if (saved && Object.prototype.hasOwnProperty.call(saved, field.key)) {
      return String(saved[field.key]);
    }
    return field.value;
  }

  function getField(format, key) {
    for (var i = 0; i < format.fields.length; i++) {
      if (format.fields[i].key === key) return format.fields[i];
    }
    return null;
  }

  function placeholderFor(field) {
    return field.placeholder || GENERIC_PLACEHOLDER;
  }

  // ---------- helpers ----------

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "className") node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  function specText(format) {
    var lines = [format.name + (format.styleName ? " (style name: " + format.styleName + ")" : "")];
    lines.push("Spec status: " + format.status);
    format.fields.forEach(function (f) {
      var v = getValue(format, f).trim();
      lines.push(LABELS[f.key] + ": " + (v || "Not set yet"));
    });
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = el("textarea", { readonly: "", "aria-hidden": "true" });
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) resolve(); else reject(new Error("copy failed"));
    });
  }

  // ---------- cards ----------

  var editingId = null;

  function renderCards() {
    var container = document.getElementById("cards");
    container.textContent = "";
    DEFAULTS.forEach(function (format) {
      container.appendChild(renderCard(format));
    });
  }

  function renderCard(format) {
    var editing = editingId === format.id;
    var aspectField = getField(format, "aspect");
    var aspect = aspectField ? getValue(format, aspectField).trim() : "";

    var titleBlock = el("div", null, [
      el("h3", { text: format.name }),
      format.styleName ? el("p", { className: "style-name", text: "Style name: " + format.styleName }) : null,
      el("span", { className: "status", text: "Spec status: " + format.status })
    ]);

    var badge = el("span", {
      className: "badge" + (aspect ? "" : " unset"),
      text: aspect || "Aspect not set"
    });

    var dl = el("dl", { className: "specs" });
    format.fields.forEach(function (field) {
      var value = getValue(format, field);
      var inputId = format.id + "-" + field.key;
      var dt = el("dt", null, [
        editing ? el("label", { "for": inputId, text: LABELS[field.key] }) : document.createTextNode(LABELS[field.key])
      ]);
      var dd;
      if (editing) {
        var ta = el("textarea", { id: inputId, "data-key": field.key, rows: "2", placeholder: placeholderFor(field) });
        ta.value = value;
        dd = el("dd", null, [ta]);
      } else if (value.trim()) {
        dd = el("dd", { text: value });
      } else {
        dd = el("dd", { className: "placeholder", text: placeholderFor(field) });
      }
      dl.appendChild(el("div", { className: "spec" }, [dt, dd]));
    });

    var actions = el("div", { className: "card-actions" });
    if (editing) {
      var save = el("button", { type: "button", className: "btn btn-primary", text: "Save" });
      save.addEventListener("click", function () { saveCard(format, dl); });
      var cancel = el("button", { type: "button", className: "btn", text: "Cancel" });
      cancel.addEventListener("click", function () { editingId = null; renderCards(); });
      actions.appendChild(save);
      actions.appendChild(cancel);
    } else {
      var copy = el("button", { type: "button", className: "btn btn-primary", text: "Copy spec" });
      copy.addEventListener("click", function () {
        copyText(specText(format)).then(
          function () { toast(format.name + " spec copied"); },
          function () { toast("Copy failed, your browser blocked clipboard access"); }
        );
      });
      var edit = el("button", { type: "button", className: "btn", text: "Edit" });
      edit.addEventListener("click", function () {
        editingId = format.id;
        renderCards();
        var first = document.getElementById(format.id + "-" + format.fields[0].key);
        if (first) first.focus();
      });
      actions.appendChild(copy);
      actions.appendChild(edit);
    }

    return el("article", {
      className: "card" + (editing ? " editing" : ""),
      id: "card-" + format.id,
      "aria-label": format.name
    }, [el("div", { className: "card-head" }, [titleBlock, badge]), dl, actions]);
  }

  function saveCard(format, dl) {
    var next = {};
    dl.querySelectorAll("textarea[data-key]").forEach(function (ta) {
      next[ta.getAttribute("data-key")] = ta.value.trim();
    });
    edits[format.id] = next;
    var ok = saveEdits(edits);
    editingId = null;
    renderCards();
    renderChecklist();
    toast(ok ? format.name + " saved" : "Saved for this session only, browser storage is unavailable");
  }

  // ---------- checklist ----------

  var checked = {};

  function stepValue(format, key) {
    var f = getField(format, key);
    return f ? getValue(format, f).trim() : "";
  }

  function checklistSteps(format) {
    var aspect = stepValue(format, "aspect");
    var titleCard = stepValue(format, "titleCard");
    var captions = stepValue(format, "captions");
    var captionText = stepValue(format, "captionText");
    var posting = stepValue(format, "posting");
    var distribution = stepValue(format, "distribution");
    var hasTitleField = !!getField(format, "titleCard");

    var steps = [
      { id: "aspect", name: "Aspect", detail: aspect ? "Set the canvas to " + aspect + "." : "" },
      {
        id: "titleCard",
        name: "Title card",
        detail: titleCard || (hasTitleField ? "" : "No title card in this spec."),
      },
      { id: "captions", name: "Captions", detail: [captions, captionText].filter(Boolean).join(". ") },
      {
        id: "export",
        name: "Export",
        detail: "Render the final file" + (aspect ? " at " + aspect : "") + " and watch it once end to end."
      },
      {
        id: "posting",
        name: "Posting rule",
        detail: [posting, distribution ? "Distribution: " + distribution : ""].filter(Boolean).join(" ")
      }
    ];
    return steps;
  }

  function renderChecklist() {
    var select = document.getElementById("checklist-format");
    var list = document.getElementById("checklist-items");
    var format = DEFAULTS.filter(function (f) { return f.id === select.value; })[0] || DEFAULTS[0];
    var state = checked[format.id] || (checked[format.id] = {});
    list.textContent = "";

    checklistSteps(format).forEach(function (step) {
      var id = "check-" + format.id + "-" + step.id;
      var box = el("input", { type: "checkbox", id: id });
      box.checked = !!state[step.id];
      box.addEventListener("change", function () { state[step.id] = box.checked; });
      var detail = el("span", {
        className: "step-detail" + (step.detail ? "" : " unset"),
        text: step.detail || "Not set yet. Fill it in on the " + format.name + " card."
      });
      var text = el("span", null, [
        el("span", { className: "step-name", text: step.name + ": " }),
        detail
      ]);
      list.appendChild(el("li", null, [el("label", { "for": id }, [box, text])]));
    });
  }

  function initChecklist() {
    var select = document.getElementById("checklist-format");
    DEFAULTS.forEach(function (f) {
      select.appendChild(el("option", { value: f.id, text: f.name }));
    });
    select.addEventListener("change", renderChecklist);
    document.getElementById("checklist-clear").addEventListener("click", function () {
      checked[select.value] = {};
      renderChecklist();
    });
    renderChecklist();
  }

  // ---------- reset ----------

  document.getElementById("reset-all").addEventListener("click", function () {
    if (!window.confirm("Reset every format to the original specs? Your edits will be cleared.")) return;
    edits = {};
    clearEdits();
    editingId = null;
    renderCards();
    renderChecklist();
    toast("Specs reset to defaults");
  });

  renderCards();
  initChecklist();
})();
