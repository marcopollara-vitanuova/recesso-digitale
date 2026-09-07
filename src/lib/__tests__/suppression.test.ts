import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planRecipients, normalizeEmail } from "../email/suppression";

describe("normalizeEmail", () => {
  it("normalizza spazi e maiuscole", () => {
    assert.equal(normalizeEmail("  Recessi@Vitanuova.IT "), "recessi@vitanuova.it");
  });
});

describe("planRecipients", () => {
  const suppressed = new Set(["recessi@vitanuova.it", "onsalute@pec.it"]);

  it("rimuove i soppressi dai CC mantenendo gli altri", () => {
    const plan = planRecipients(
      "compagnia@example.com",
      ["clienti@vitanuova.it", "Recessi@Vitanuova.it"],
      [],
      suppressed,
    );
    assert.deepEqual(plan.cc, ["clienti@vitanuova.it"]);
    assert.deepEqual(plan.droppedCc, ["Recessi@Vitanuova.it"]);
    assert.equal(plan.toSuppressed, false);
  });

  it("segnala il destinatario principale soppresso", () => {
    const plan = planRecipients("onsalute@pec.it", ["clienti@vitanuova.it"], [], suppressed);
    assert.equal(plan.toSuppressed, true);
    assert.deepEqual(plan.cc, ["clienti@vitanuova.it"]);
  });

  it("gestisce cc/bcc assenti", () => {
    const plan = planRecipients("compagnia@example.com", undefined, undefined, suppressed);
    assert.deepEqual(plan.cc, []);
    assert.deepEqual(plan.bcc, []);
    assert.equal(plan.toSuppressed, false);
  });

  it("filtra anche i BCC soppressi", () => {
    const plan = planRecipients(
      "compagnia@example.com",
      [],
      ["onsalute@pec.it", "archivio@example.com"],
      suppressed,
    );
    assert.deepEqual(plan.bcc, ["archivio@example.com"]);
    assert.deepEqual(plan.droppedBcc, ["onsalute@pec.it"]);
  });
});
