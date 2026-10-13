(function () {
  "use strict";

  var STORAGE_KEY = "clipFormats.edits.v2";
  var GENERIC_PLACEHOLDER = "Not set yet, tap Edit to fill it in.";
  var FFRF_VISUAL_PLACEHOLDER = "Confirm from a finished FFRF cut.";
  var MERGER_VISUAL_PLACEHOLDER = "Prelims are raw, no styling applied yet. Set the visual spec from a finished cut.";

  var LABELS = {
    aspect: "Aspect",
    canvas: "Canvas",
    titleCard: "Title card",
    video: "Video",
    captions: "Captions",
    captionText: "Instagram caption",
    captionVoice: "Caption voice",
    hashtags: "Hashtags",
    brandColors: "Brand colors",
    content: "Content",
    context: "Context",
    currentState: "Current state",
    visualStatus: "Visual spec status",
    source: "Source material",
    review: "Review format",
    posting: "Posting rule",
    distribution: "Distribution",
    knownBug: "Known bug"
  };

  // Defaults pulled from Will's past videos and notes. An empty value renders as a placeholder.
  var DEFAULTS = [
    {
      id: "clean-virginia",
      name: "Clean Virginia",
      styleName: "ketchum",
      status: "Confirmed (nextera-ketchum-cv.mp4, build_cv_edit.py)",
      fields: [
        { key: "canvas", value: "1080x1920 (9:16), black background." },
        { key: "titleCard", value: "White rounded rectangle (radius 36), Poppins Bold black text, card hugs the text, upper third, full duration. Starts with \"WATCH: ...\". Example: \"WATCH: The CEO of NextEra, the company trying to take over Virginia's electricity, praises Trump for his 'Leadership'\"" },
        { key: "video", value: "Source footage scaled to 1080 wide, middle band (y 780 to 1388)." },
        { key: "captions", value: "Burned in, white Noto Sans Bold 92pt, black outline, bottom center, lowercase short-phrase cues (example: \"prioritize alaska from day\"). No caption bubbles: plain outlined text on the black background." },
        { key: "source", value: "Hearing and news footage, best beats only." },
        { key: "brandColors", value: "Near-black navy #11171E, yellow #FFD000 headlines, deep orange #F76A06 for CTAs and numbers, amber #FC9F00 secondary highlights (from the carousel brand research)." },
        { key: "captionVoice", value: "Stakes first, stat second, action last." },
        { key: "hashtags", value: "#VirginiaIsNotForSale #DontFloridaVirginia" },
        { key: "posting", value: "Never auto-publish. Return footage, edits, and suggestions to Will." },
        { key: "knownBug", value: "build_cv_edit.py generates the title card PNG but never overlays it, so the Newport News hearing render shipped without its title card. Check renders for the card." }
      ]
    },
    {
      id: "willztalks",
      name: "WillzTalks",
      status: "Observed (DdNHvc6vYjQ.mp4)",
      fields: [
        { key: "aspect", value: "9:16 vertical reels" },
        { key: "content", value: "Political commentary" },
        { key: "titleCard", value: "White rounded rectangle box, about 90 percent of frame width, upper third, black bold sans-serif, title-case, 2 lines. Example: \"Zionists Walk Hand in Hand With Antisemites\"" },
        { key: "captions", value: "Burned in, ALL CAPS, bold heavy sans-serif (TikTok style), white text with thick black outline, no box behind the text, bottom center. Active word highlighted in light cyan/teal, rest white. About 3 words per cue." },
        { key: "captionText", value: "Verbatim, plain English." },
        { key: "posting", value: "No auto-publish without Will." },
        { key: "distribution", value: "Instagram, TikTok, RedNote, Bilibili, Substack, UpScrolled, Bluesky" }
      ]
    },
    {
      id: "ffrf",
      name: "FFRF",
      status: "Partial",
      fields: [
        { key: "review", value: "Numbered clips, each with a verdict (really good / good / meh / not great) plus a trim direction (\"start 30 seconds earlier\", \"make it go a minute longer\", \"put away\") plus timestamps." },
        { key: "source", value: "Long-form episodes and press releases only." },
        { key: "posting", value: "Proposals only, never auto-produce. No Shorts scouting, Will makes those himself." },
        { key: "visualStatus", value: "NOT yet pulled from a finished FFRF cut (no finished FFRF video in the workspace, Will edits on his phone). Confirm from a finished FFRF cut." },
        { key: "aspect", value: "", placeholder: FFRF_VISUAL_PLACEHOLDER },
        { key: "titleCard", value: "", placeholder: FFRF_VISUAL_PLACEHOLDER },
        { key: "captions", value: "", placeholder: FFRF_VISUAL_PLACEHOLDER },
        { key: "distribution", value: "" }
      ]
    },
    {
      id: "merger-coalition",
      name: "Merger Coalition",
      status: "Visual spec not set",
      fields: [
        { key: "context", value: "Stop the Merger coalition. Dominion-NextEra merger opposition content. Same campaign family as Clean Virginia." },
        { key: "hashtags", value: "#VirginiaIsNotForSale #DontFloridaVirginia" },
        { key: "currentState", value: "The Justin prelim cuts are raw and unstyled: no captions, no title card." },
        { key: "visualStatus", value: "Prelims are raw, no styling applied yet. Set the visual spec from a finished cut." },
        { key: "aspect", value: "Proper 9:16 vertical, face-tracked crop, never stretched. (Settled.)" },
        { key: "titleCard", value: "", placeholder: MERGER_VISUAL_PLACEHOLDER },
        { key: "captions", value: "", placeholder: MERGER_VISUAL_PLACEHOLDER },
        { key: "review", value: "Same Y/N/Change stacked calls. The Riverside session left 9 yes/no calls pending: intro take, CTA splice, Teddy dog CTA, trailing CTA fragment, dog outtakes, profit-share stumbles, CTA take choice, CTA standardization, 16:9 vs 9:16. The 9:16 call is now settled (see Aspect)." },
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

  // Short ratio for the badge, e.g. "9:16", taken from the aspect or canvas field.
  function aspectRatio(format) {
    var f = getField(format, "aspect") || getField(format, "canvas");
    var v = f ? getValue(format, f).trim() : "";
    var m = v.match(/\d+:\d+/);
    return m ? m[0] : v;
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
    var ratio = aspectRatio(format);

    var titleBlock = el("div", null, [
      el("h3", { text: format.name }),
      format.styleName ? el("p", { className: "style-name", text: "Style name: " + format.styleName }) : null,
      el("span", { className: "status", text: "Spec status: " + format.status })
    ]);

    var badge = el("span", {
      className: "badge" + (ratio ? "" : " unset"),
      text: ratio || "Aspect not set"
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
    var aspect = stepValue(format, "aspect") || stepValue(format, "canvas");
    var ratio = aspectRatio(format);
    var titleCard = stepValue(format, "titleCard");
    var captions = stepValue(format, "captions");
    var captionText = stepValue(format, "captionText");
    var review = stepValue(format, "review");
    var knownBug = stepValue(format, "knownBug");
    var posting = stepValue(format, "posting");
    var distribution = stepValue(format, "distribution");
    var hasTitleField = !!getField(format, "titleCard");

    var steps = [
      { id: "aspect", name: getField(format, "canvas") ? "Canvas" : "Aspect", detail: aspect },
      {
        id: "titleCard",
        name: "Title card",
        detail: titleCard || (hasTitleField ? "" : "No title card in this spec.")
      }
    ];
    if (getField(format, "video")) {
      steps.push({ id: "video", name: "Video", detail: stepValue(format, "video") });
    }
    steps.push({
      id: "captions",
      name: "Captions",
      detail: [captions, captionText ? "Instagram caption: " + captionText : ""].filter(Boolean).join(" ")
    });
    steps.push({
      id: "review",
      name: "Review",
      detail: review || "Stack Y/N/Change calls for every cut (see How Will reviews a cut)."
    });
    steps.push({
      id: "export",
      name: "Export",
      detail: "Render the final file" + (ratio ? " at " + ratio : "") + " and watch it once end to end." +
        (knownBug ? " Known bug: " + knownBug : "")
    });
    steps.push({
      id: "posting",
      name: "Posting rule",
      detail: [posting, distribution ? "Distribution: " + distribution : ""].filter(Boolean).join(" ")
    });
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
