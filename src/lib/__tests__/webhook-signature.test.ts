import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyResendWebhook } from "../email/webhook-signature";

const secretBody = Buffer.from("chiave-di-test-per-firma-svix-0123").toString("base64");
const secret = `whsec_${secretBody}`;
const svixId = "msg_2abcDEF";
const payload = JSON.stringify({
  type: "email.bounced",
  data: { email_id: "e0526c7c-4145-4634-b66d-83db6d1d82b0", to: ["recessi@vitanuova.it"] },
});

const now = new Date("2026-09-07T10:00:00.000Z");
const timestamp = String(Math.floor(now.getTime() / 1000));

function sign(id: string, ts: string, body: string, key = secretBody) {
  const mac = createHmac("sha256", Buffer.from(key, "base64"))
    .update(`${id}.${ts}.${body}`)
    .digest("base64");
  return `v1,${mac}`;
}

const base = { payload, svixId, svixTimestamp: timestamp, secret, now };

describe("verifyResendWebhook", () => {
  it("accetta una firma valida", () => {
    const res = verifyResendWebhook({ ...base, svixSignature: sign(svixId, timestamp, payload) });
    assert.equal(res.ok, true);
  });

  it("accetta se almeno una delle firme presenti è valida (rotazione secret)", () => {
    const res = verifyResendWebhook({
      ...base,
      svixSignature: `v1,YWJjZA== ${sign(svixId, timestamp, payload)}`,
    });
    assert.equal(res.ok, true);
  });

  it("rifiuta un body manomesso dopo la firma", () => {
    const res = verifyResendWebhook({
      ...base,
      payload: payload.replace("bounced", "delivered"),
      svixSignature: sign(svixId, timestamp, payload),
    });
    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.status, 401);
  });

  it("rifiuta una firma prodotta con un secret diverso", () => {
    const altro = Buffer.from("secret-diverso").toString("base64");
    const res = verifyResendWebhook({
      ...base,
      svixSignature: sign(svixId, timestamp, payload, altro),
    });
    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.status, 401);
  });

  it("rifiuta un svix-id diverso da quello firmato", () => {
    const res = verifyResendWebhook({ ...base, svixSignature: sign("msg_altroId", timestamp, payload) });
    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.status, 401);
  });

  it("rifiuta header di firma mancanti", () => {
    const senzaFirma = verifyResendWebhook({ ...base, svixSignature: null });
    assert.equal(senzaFirma.ok, false);
    assert.equal(senzaFirma.ok === false && senzaFirma.status, 400);

    const senzaId = verifyResendWebhook({ ...base, svixId: null, svixSignature: "v1,x" });
    assert.equal(senzaId.ok, false);
    assert.equal(senzaId.ok === false && senzaId.status, 400);
  });

  it("rifiuta un timestamp fuori tolleranza (replay)", () => {
    const vecchio = String(Math.floor(now.getTime() / 1000) - 3600);
    const res = verifyResendWebhook({
      ...base,
      svixTimestamp: vecchio,
      svixSignature: sign(svixId, vecchio, payload),
    });
    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.status, 400);
  });

  it("rifiuta un timestamp non numerico", () => {
    const res = verifyResendWebhook({ ...base, svixTimestamp: "non-un-numero", svixSignature: "v1,x" });
    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.status, 400);
  });

  it("rifiuta se non è presente nessuna firma di schema v1", () => {
    const res = verifyResendWebhook({ ...base, svixSignature: "v0,YWJjZA==" });
    assert.equal(res.ok, false);
    assert.equal(res.ok === false && res.status, 400);
  });
});
