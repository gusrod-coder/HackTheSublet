"use client";
/**
 * Terms and contacts. LANE: h2 (built by h3, maintained by h2 from Nov 20). Spec: §5 Generated terms, gate §2.5.
 * Figma: HackTheLease 10:281 "06 Incoming · Terms" and 10:351 "06b … (contacts shared)".
 * Shared by the incoming AND the stayers (viewerRole). Contacts unlock for everyone at once
 * (server gate); we poll so every party sees the reveal within a few seconds.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import type { ContactMethod, ContactsResponse, TermKey } from "@/lib/types";
import { SampleBadge } from "@/components/shared/ui";
import { Icon, StepDots, Status, cx, kit } from "@/components/leaver/kit";
import { usePoll } from "@/components/incoming/usePoll";
import s from "./terms.module.css";

/** Figma order + short labels for the contact pills. */
const METHODS: Array<{ key: ContactMethod; label: string; placeholder: string; type: string }> = [
  { key: "text", label: "Text", placeholder: "(734) 555-0100", type: "tel" },
  { key: "phone", label: "Call", placeholder: "(734) 555-0100", type: "tel" },
  { key: "email", label: "Email", placeholder: "you@umich.edu", type: "email" },
  { key: "instagram", label: "Instagram", placeholder: "@yourhandle", type: "text" },
];
const methodLabel = (m: ContactMethod) => METHODS.find((x) => x.key === m)?.label ?? m;
const POLL_MS = 3000;

/** kit .page supplies the --hf-* aliases; s.shell drops its inset card look so this screen lines up with the rest of the app. */
function Page({ children }: { children: ReactNode; warmTop?: boolean }) {
  return <div className={cx(kit.page, s.shell)}>{children}</div>;
}

export default function TermsPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useApi(() => api.requests.get(id), [id]);
  const terms = useApi(() => api.requests.terms(id), [id]);
  const me = useApi(() => api.me.get(), []);

  const [method, setMethod] = useState<ContactMethod | null>(null);
  const [value, setValue] = useState("");
  const [contactSaved, setContactSaved] = useState(false);
  const [contacts, setContacts] = useState<ContactsResponse["contacts"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Prefill the contact form from the profile.
  useEffect(() => {
    const u = me.data?.user;
    if (u?.contactMethod && method === null) {
      setMethod(u.contactMethod);
      setValue(u.contactValue ?? "");
      setContactSaved(true);
    }
  }, [me.data, method]);

  // Poll terms until contacts unlock, so the reveal lands for every party at about the same moment.
  const unlocked = terms.data?.contactsUnlocked ?? false;
  const notApproved = terms.error?.code === "NOT_APPROVED";
  // usePoll always calls the latest closure (no stale id/reload) and pauses while the tab is hidden.
  usePoll(() => void (notApproved ? detail.reload().then(() => terms.reload()) : terms.reload()), POLL_MS, !unlocked);

  // Fetch contacts once unlocked, and keep retrying until it succeeds (h3 REQ: one failed GET used to
  // leave "Loading contacts…" forever). Results for a stale request id are ignored.
  const [contactsRetrying, setContactsRetrying] = useState(false);
  const currentId = useRef(id);
  currentId.current = id;
  const fetchContacts = () => {
    const forId = id;
    api.requests
      .contacts(forId)
      .then((r) => {
        if (currentId.current !== forId) return;
        setContacts(r.contacts);
        setContactsRetrying(false);
      })
      .catch(() => currentId.current === forId && setContactsRetrying(true));
  };
  useEffect(() => {
    setContacts(null);
  }, [id]);
  useEffect(() => {
    if (unlocked && !contacts) fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked, id]);
  usePoll(fetchContacts, POLL_MS, unlocked && !contacts);

  const myId = me.data?.user?.id;
  const mine = terms.data?.parties.find((p) => p.id === myId);
  const agreed = new Set<TermKey>(mine?.agreed ?? []);
  const allMineAgreed = !!terms.data && terms.data.terms.every((t) => agreed.has(t.key));

  async function guarded(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const agree = (key: TermKey) =>
    guarded(async () => {
      terms.setData(await api.requests.agree(id, key));
    });

  const saveContact = async () => {
    if (!method || !value.trim()) return;
    await api.me.setContact({ method, value: value.trim() });
    setContactSaved(true);
  };

  const agreeAllAndShare = () =>
    guarded(async () => {
      if (!terms.data) return;
      if (method && value.trim() && !contactSaved) await saveContact();
      let latest = terms.data;
      for (const t of terms.data.terms) if (!agreed.has(t.key)) latest = await api.requests.agree(id, t.key);
      terms.setData(latest);
      if (!method || !value.trim()) setErr("Pick how they should reach you and fill it in, then you're done.");
      else void terms.reload();
    });

  const viewerRole = detail.data?.viewerRole;
  const listing = detail.data?.listing;
  const backHref = viewerRole === "stayer" ? "/stayer/inbox" : "/incoming/requests";

  // ── Gates the server enforces: explain and redirect ──
  if (detail.error?.code === "NOT_A_PARTY")
    return (
      <Page>
        <p className={cx(kit.notice, kit.noticeBlush)}>Only the incoming student and the roommates on this request can see its terms.</p>
        <Link href="/" className={kit.btn}>Back to start</Link>
      </Page>
    );
  if (detail.error || (detail.loading && !detail.data)) return <Page><Status loading={detail.loading} error={detail.error} /></Page>;

  return (
    <Page warmTop>
      {viewerRole === "incoming" ? (
        <StepDots step={4} total={4} label={listing?.name ?? "your house"} />
      ) : (
        <div className={kit.row}>
          <span className={cx(kit.caption, kit.muted)}>
            {me.data?.user ? `viewing as ${me.data.user.name} · ` : ""}
            {listing?.name}
          </span>
          {listing && <SampleBadge show={listing.isSample} />}
        </div>
      )}
      <div className={kit.heroText}>
        <h1 className={kit.display}>Agree on how the house will work</h1>
        <p className={kit.lede}>
          These come from everyone's answers. Once you've all agreed, you'll each see the others' preferred contact. No in-app messaging, no
          awkward DMs from strangers.
        </p>
        {listing && (
          <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>
            <strong>{listing.address}</strong> · {listing.area}
          </p>
        )}
      </div>

      {notApproved && detail.data && (
        <div className={cx(kit.soft, kit.col)}>
          <h2 className={kit.headingS}>
            {detail.data.status === "declined" ? "This request is closed" : "Not every roommate has said yes yet"}
          </h2>
          <p className={kit.muted} style={{ margin: 0 }}>
            {detail.data.status === "declined"
              ? "A roommate passed, so there are no terms to agree on."
              : `Terms open once ${detail.data.stayers.map((x) => x.name).join(", ")} have all approved. This page updates by itself.`}
          </p>
          <Link href={backHref} className={cx(kit.btn, kit.btnSecondary)}>
            {viewerRole === "stayer" ? "Back to requests" : "Back to my requests"}
          </Link>
        </div>
      )}
      {!notApproved && <Status loading={terms.loading && !terms.data} error={terms.error} />}

      {terms.data && (
        <div className={kit.split}>
          <div className={kit.col}>
            {terms.data.terms.map((t) => {
              const on = agreed.has(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  className={cx(s.term, on && s.termOn)}
                  aria-pressed={on}
                  disabled={on || busy}
                  onClick={() => void agree(t.key)}
                >
                  <span className={cx(s.box, on && s.boxOn)}>{on && <Icon name="check" />}</span>
                  <span className={s.termText}>
                    <span className={kit.headingS}>{t.text}</span>
                    <span className={cx(kit.caption, kit.muted)}>{t.why}</span>
                  </span>
                </button>
              );
            })}
            {/* Figma 06/06b caption (10:333): money and the lease stay outside the app. */}
            <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>
              Rent, deposit and the sublease agreement are settled with {listing?.leader.name ?? "the leaver"} and the landlord.
              Burrow never touches money.
            </p>
          </div>

          <div className={kit.col} style={{ gap: 16 }}>
            <div className={cx(kit.soft, kit.col)}>
              <h2 className={kit.headingS}>How should they reach you?</h2>
              <div className={kit.pills} role="group" aria-label="Preferred contact method">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className={cx(kit.pill, s.pill)}
                    aria-pressed={method === m.key}
                    disabled={unlocked}
                    onClick={() => {
                      setMethod(m.key);
                      setContactSaved(false);
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {method && !unlocked && (
                <form
                  className={s.contactForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void guarded(saveContact);
                  }}
                >
                  <input
                    className={kit.input}
                    type={METHODS.find((m) => m.key === method)?.type}
                    placeholder={METHODS.find((m) => m.key === method)?.placeholder}
                    aria-label={`Your ${methodLabel(method)} contact`}
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setContactSaved(false);
                    }}
                  />
                  {!contactSaved && (
                    <button type="submit" className={cx(kit.btn, kit.btnSecondary)} disabled={busy || !value.trim()}>
                      Save
                    </button>
                  )}
                </form>
              )}
              {contactSaved && !unlocked && <span className={cx(kit.caption, kit.muted)}>Saved. Only shown once everyone has agreed.</span>}
            </div>

            {unlocked ? (
              <div className={cx(kit.sticker, kit.tintSky, kit.col)}>
                <span className={cx(kit.headingS, s.allSet)}>
                  <Icon name="sparkle" size={24} /> You're all set!
                </span>
                {(contacts ?? [])
                  .filter((c) => c.id !== myId)
                  .map((c) => (
                    <div key={c.id} className={s.contact}>
                      <span className={kit.label}>{c.name}</span>
                      <span className={s.contactValue}>
                        {methodLabel(c.method)} · {c.value}
                      </span>
                    </div>
                  ))}
                {!contacts && <span className={kit.muted}>{contactsRetrying ? "Couldn’t load contacts yet. Retrying…" : "Loading contacts…"}</span>}
                <span className={cx(kit.caption, kit.muted)}>
                  {listing?.isSample ? "Sample contacts. " : ""}They can now see yours too.
                </span>
                <Link href={backHref} className={cx(kit.btn, kit.btnSecondary)}>
                  Back to start
                </Link>
              </div>
            ) : (
              <div className={cx(kit.sticker, kit.tintCream, kit.col)}>
                <span className={cx(kit.headingS, s.allSet)} style={{ color: "inherit" }}>
                  <Icon name="lock" size={24} /> Household contacts
                </span>
                <p className={kit.muted} style={{ margin: 0 }}>
                  Agree to every term and pick how to reach you. Then you'll all see each other's contact at the same moment.
                </p>
                <ul className={s.parties}>
                  {terms.data.parties.map((p) => {
                    const done = p.agreed.length === terms.data!.terms.length && p.hasContactMethod;
                    return (
                      <li key={p.id} className={cx(kit.caption, s.party)}>
                        <span>
                          {p.name}
                          {p.id === myId ? " (you)" : ""}
                        </span>
                        <span className={cx(kit.chip, done ? kit.chipLeaf : kit.chipButter)}>
                          {done
                            ? "ready ✓"
                            : `${p.agreed.length}/${terms.data!.terms.length} terms${p.hasContactMethod ? "" : " · no contact yet"}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {!(allMineAgreed && contactSaved) ? (
                  <button type="button" className={cx(kit.btn, s.primary)} disabled={busy} onClick={() => void agreeAllAndShare()}>
                    Agree to all and share my contact
                  </button>
                ) : (
                  <span className={cx(kit.caption, kit.muted)}>You're ready. Waiting on the others; this updates by itself.</span>
                )}
              </div>
            )}
            {err && <p className={cx(kit.notice, kit.noticeBlush)} role="alert">{err}</p>}
          </div>
        </div>
      )}
    </Page>
  );
}
