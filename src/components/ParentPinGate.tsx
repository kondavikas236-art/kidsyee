"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Delete, Loader2, Lock, ShieldCheck } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import type { DocumentReference } from "firebase/firestore";
import { useAuth } from "@/firebase";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KidsyeeLogo } from "@/components/Logo";
import { cn } from "@/lib/utils";

/**
 * Parent PIN lock. Keeps kids out of the parent section (where Cockroach Mode
 * and time limits live). Only a SHA-256 hash of the PIN is stored, on the
 * parent's Firestore profile. Unlocking lasts until the app goes back to kid mode.
 */

const UNLOCK_KEY = "kidsyee-parent-unlocked";
const PIN_LENGTH = 4;
const MAX_TRIES = 5;
const COOLDOWN_MS = 30_000;

export function lockParentArea() {
  try { sessionStorage.removeItem(UNLOCK_KEY); } catch {}
}

async function hashPin(uid: string, pin: string) {
  const data = new TextEncoder().encode(`kidsyee:${uid}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Mode = "unlock" | "create" | "confirm" | "forgot";

export function ParentPinGate({
  uid,
  email,
  pinHash,
  isLoading,
  parentRef,
  children,
}: {
  uid: string;
  email?: string | null;
  pinHash?: string | null;
  isLoading: boolean;
  parentRef: DocumentReference | null;
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [mode, setMode] = useState<Mode>("unlock");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [tries, setTries] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [justSavedHash, setJustSavedHash] = useState<string | null>(null);
  useEffect(() => { setJustSavedHash(null); }, [pinHash]);
  const effectiveHash = pinHash || justSavedHash;

  useEffect(() => {
    try { setUnlocked(sessionStorage.getItem(UNLOCK_KEY) === uid); } catch { setUnlocked(false); }
  }, [uid]);

  // No PIN saved yet (new parent, or "Change PIN") -> create one.
  useEffect(() => {
    if (isLoading) return;
    if (!pinHash && mode !== "confirm" && mode !== "forgot") setMode("create");
    if (pinHash && mode === "create" && !unlocked) setMode("unlock");
  }, [pinHash, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
    setPin("");
  };

  const unlock = () => {
    try { sessionStorage.setItem(UNLOCK_KEY, uid); } catch {}
    setUnlocked(true);
  };

  const submit = async (value: string) => {
    if (mode === "unlock") {
      if (Date.now() < blockedUntil) return;
      if ((await hashPin(uid, value)) === effectiveHash) {
        setTries(0);
        setPin("");
        setError("");
        unlock();
      } else {
        const n = tries + 1;
        setTries(n);
        if (n >= MAX_TRIES) {
          setBlockedUntil(Date.now() + COOLDOWN_MS);
          setTries(0);
          fail("Too many tries. Wait 30 seconds.");
          setTimeout(() => setError(""), COOLDOWN_MS);
        } else {
          fail(`Wrong PIN. ${MAX_TRIES - n} tries left.`);
        }
      }
    } else if (mode === "create") {
      setFirstPin(value);
      setPin("");
      setError("");
      setMode("confirm");
    } else if (mode === "confirm") {
      if (value !== firstPin) {
        setMode("create");
        setFirstPin("");
        fail("PINs didn't match. Try again.");
        return;
      }
      const newHash = await hashPin(uid, value);
      if (parentRef) {
        setDocumentNonBlocking(parentRef, { id: uid, parentPinHash: newHash }, { merge: true });
      }
      setJustSavedHash(newHash);
      setPin("");
      setError("");
      setMode("unlock");
      unlock();
    }
  };

  const press = (digit: string) => {
    if (busy || Date.now() < blockedUntil || pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) setTimeout(() => submit(next), 120);
  };

  const resetWithPassword = async () => {
    if (!auth?.currentUser || !email) return fail("Please log in again to reset your PIN.");
    setBusy(true);
    try {
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password));
      setPassword("");
      setError("");
      setMode("create");
    } catch {
      setError("That password isn't right.");
    } finally {
      setBusy(false);
    }
  };

  if (unlocked === null || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (unlocked && effectiveHash) return <>{children}</>;
  // Unlocked but PIN was just cleared via "Change PIN": fall through to create.

  const title =
    mode === "unlock" ? "Parents only" :
    mode === "create" ? "Create a parent PIN" :
    mode === "confirm" ? "Type the PIN again" : "Reset your PIN";
  const subtitle =
    mode === "unlock" ? "Enter your 4-digit PIN to open the Control Center." :
    mode === "create" ? "Kids won't be able to change limits or turn off Cockroach Mode." :
    mode === "confirm" ? "Just to make sure you remember it." : "Enter your Kidsyee account password.";

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="glass-strong w-full max-w-sm rounded-[2.5rem] p-7 text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30">
          {mode === "unlock" ? <Lock className="h-8 w-8" /> : mode === "forgot" ? <KidsyeeLogo className="h-9 w-9" /> : <ShieldCheck className="h-8 w-8" />}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
        </div>

        {mode === "forgot" ? (
          <div className="space-y-3 text-left">
            <Input
              type="password"
              placeholder="Account password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl h-12 bg-white/70"
            />
            {error && <p className="text-sm font-bold text-destructive text-center">{error}</p>}
            <Button onClick={resetWithPassword} disabled={!password || busy} className="w-full rounded-full h-12 font-bold">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
            </Button>
            <button onClick={() => { setMode("unlock"); setError(""); }} className="w-full text-sm font-bold text-muted-foreground py-2">
              Back
            </button>
          </div>
        ) : (
          <>
            <div className={cn("flex justify-center gap-4", shake && "animate-pin-shake")}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-4 w-4 rounded-full border-2 transition-all duration-150",
                    i < pin.length ? "bg-primary border-primary scale-110" : "border-primary/40 bg-white/60"
                  )}
                />
              ))}
            </div>
            <p className={cn("h-5 text-sm font-bold", error ? "text-destructive" : "text-transparent")}>{error || "."}</p>

            <div className="grid grid-cols-3 gap-3 px-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
                <button key={d} onClick={() => press(d)} className="glass h-16 rounded-2xl text-2xl font-black active:scale-95 active:bg-primary/20 transition-transform">
                  {d}
                </button>
              ))}
              <div />
              <button onClick={() => press("0")} className="glass h-16 rounded-2xl text-2xl font-black active:scale-95 active:bg-primary/20 transition-transform">
                0
              </button>
              <button onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Delete" className="h-16 rounded-2xl flex items-center justify-center text-muted-foreground active:scale-95">
                <Delete className="h-7 w-7" />
              </button>
            </div>

            <div className="flex justify-between text-sm font-bold pt-1">
              <Link href="/kid/dashboard" className="text-muted-foreground hover:text-primary">Back to kid mode</Link>
              {mode === "unlock" && (
                <button onClick={() => { setMode("forgot"); setError(""); setPin(""); }} className="text-primary">
                  Forgot PIN?
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
