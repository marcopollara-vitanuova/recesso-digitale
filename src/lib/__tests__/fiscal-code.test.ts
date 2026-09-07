import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidItalianFiscalCode } from "../fiscal-code";

describe("isValidItalianFiscalCode", () => {
  it("accetta un codice fiscale valido", () => {
    assert.equal(isValidItalianFiscalCode("RSSMRA80A01H501U"), true);
  });

  it("accetta lowercase e spazi (normalizzazione)", () => {
    assert.equal(isValidItalianFiscalCode("  rssmra80a01h501u  "), true);
  });

  it("rifiuta un carattere di controllo errato", () => {
    assert.equal(isValidItalianFiscalCode("RSSMRA80A01H501A"), false);
  });

  it("rifiuta formato non valido", () => {
    assert.equal(isValidItalianFiscalCode("ABC"), false);
    assert.equal(isValidItalianFiscalCode("1234567890123456"), false);
    assert.equal(isValidItalianFiscalCode(""), false);
  });
});
