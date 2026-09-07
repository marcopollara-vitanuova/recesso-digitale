import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findUnknownPlaceholders, renderTemplate, escapeHtml } from "../email/template-vars";

describe("findUnknownPlaceholders", () => {
  it("non segnala variabili ammesse", () => {
    assert.deepEqual(findUnknownPlaceholders("Ciao {{customerFirstName}} {{policyNumber}}"), []);
  });

  it("segnala variabili non ammesse (deduplicate)", () => {
    assert.deepEqual(findUnknownPlaceholders("{{foo}} {{customerEmail}} {{foo}} {{bar}}"), [
      "foo",
      "bar",
    ]);
  });

  it("gestisce input vuoto/nullo", () => {
    assert.deepEqual(findUnknownPlaceholders(""), []);
    assert.deepEqual(findUnknownPlaceholders(null), []);
    assert.deepEqual(findUnknownPlaceholders(undefined), []);
  });
});

describe("renderTemplate", () => {
  it("sostituisce i placeholder in modalità testo", () => {
    assert.equal(
      renderTemplate("Ciao {{customerFirstName}}", { customerFirstName: "Mario" }),
      "Ciao Mario",
    );
  });

  it("lascia vuote le variabili mancanti", () => {
    assert.equal(renderTemplate("X{{policyNumber}}Y", {}), "XY");
  });

  it("esegue l'escape HTML in modalità html", () => {
    assert.equal(
      renderTemplate("{{customerFirstName}}", { customerFirstName: '<b>&"' }, "html"),
      "&lt;b&gt;&amp;&quot;",
    );
  });
});

describe("escapeHtml", () => {
  it("codifica i caratteri speciali", () => {
    assert.equal(
      escapeHtml("<div class=\"x\">&'</div>"),
      "&lt;div class=&quot;x&quot;&gt;&amp;&#39;&lt;/div&gt;",
    );
  });
});
