"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  deleteSavedProfile,
  getContributionCalendar,
  getSavedProfile,
  saveProfile,
} from "@/api/profile";
import { defaultProfile, normalizeProfile, type ContributionCalendar, type ProfileConfig } from "@/lib/profile/types";
import { hasLightBackground, imageToAscii } from "@/lib/profile/ascii";
import { THEMES } from "@/lib/profile/themes";
import { buildProfileExport } from "@/lib/profile/export";
import type { User } from "@/types";

export type CalendarState =
  | { status: "loading" }
  | { status: "ready"; data: ContributionCalendar }
  | { status: "error"; message: string };

const draftKey = (username: string) => `flowlens_profile_draft:${username}`;

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof msg === "string") return msg;
    if (!err.response) return "Couldn't reach the FlowLens server.";
  }
  return err instanceof Error ? err.message : fallback;
}

function readDraft(username: string): { profile: ProfileConfig; at: string } | null {
  try {
    const raw = localStorage.getItem(draftKey(username));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** ASCII for a photo held in memory, using the theme to decide which tones are dense. */
function asciiFor(img: HTMLImageElement, p: ProfileConfig): string[] {
  const { columns, contrast, brightness, charset, invert, enhance } = p.portrait;
  return imageToAscii(img, columns, {
    charset,
    autoLevel: enhance,
    contrast,
    brightness,
    invert: invert !== THEMES[p.theme].light,
  });
}

export function useProfileBuilder(user: User | null) {
  const [profile, setProfile] = useState<ProfileConfig>(() => defaultProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CalendarState>({ status: "loading" });
  // The source photo lives only in memory for the session so the portrait can be re-tuned.
  const photoRef = useRef<{ img: HTMLImageElement; lightBackground: boolean } | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);

  const username = user?.username ?? "";

  const fetchCalendar = useCallback(
    () =>
      getContributionCalendar().then(
        (data) => setCalendar({ status: "ready", data }),
        (err) => setCalendar({ status: "error", message: errorMessage(err, "Contribution data is unavailable.") })
      ),
    []
  );

  const loadCalendar = useCallback(() => {
    setCalendar({ status: "loading" });
    fetchCalendar();
  }, [fetchCalendar]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const base = defaultProfile(user);
      let server: { profile: ProfileConfig | null; updatedAt: string | null } = { profile: null, updatedAt: null };
      try {
        server = await getSavedProfile();
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Couldn't load your saved profile."));
      }
      if (cancelled) return;
      const draft = readDraft(user.username);
      const draftIsNewer = draft && (!server.updatedAt || new Date(draft.at) > new Date(server.updatedAt));
      if (draftIsNewer) {
        setProfile(normalizeProfile(draft.profile, base));
        setDirty(true);
        setNotice("Restored your unsaved draft from this browser.");
      } else {
        setProfile(normalizeProfile(server.profile, base));
      }
      setSavedAt(server.updatedAt);
      setLoading(false);
    })();
    fetchCalendar();
    return () => {
      cancelled = true;
    };
  }, [user, fetchCalendar]);

  // Keep a local draft so nothing is lost on refresh, even before saving to the server.
  useEffect(() => {
    if (loading || !dirty || !username) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(username), JSON.stringify({ profile, at: new Date().toISOString() }));
      } catch {
        // Storage full or disabled; the in-memory state is still intact.
      }
    }, 400);
    return () => clearTimeout(t);
  }, [profile, dirty, loading, username]);

  /** Applies a change; re-renders the portrait from the in-memory photo when its inputs change. */
  const update = useCallback((recipe: (p: ProfileConfig) => ProfileConfig) => {
    setProfile((prev) => {
      let next = recipe(prev);
      const photo = photoRef.current;
      // Which tones read as "empty" depends on the theme, so re-derive shading on a theme switch.
      if (photo && next.theme !== prev.theme) {
        next = { ...next, portrait: { ...next.portrait, invert: photo.lightBackground !== THEMES[next.theme].light } };
      }
      const portraitInputsChanged =
        next.theme !== prev.theme ||
        (["columns", "contrast", "brightness", "charset", "invert", "enhance"] as const).some((k) => next.portrait[k] !== prev.portrait[k]);
      if (photo && portraitInputsChanged) {
        try {
          return { ...next, portrait: { ...next.portrait, ascii: asciiFor(photo.img, next) } };
        } catch {
          return next;
        }
      }
      return next;
    });
    setDirty(true);
  }, []);

  /** Converts a decoded photo to ASCII and keeps it in memory for re-tuning. Throws PortraitError. */
  const applyPhoto = useCallback(
    (img: HTMLImageElement) => {
      // Start with shading that leaves the photo's background empty; the user can flip it.
      const lightBackground = hasLightBackground(img);
      const invert = lightBackground !== THEMES[profile.theme].light;
      const ascii = asciiFor(img, { ...profile, portrait: { ...profile.portrait, invert } });
      photoRef.current = { img, lightBackground };
      setHasPhoto(true);
      setProfile((p) => ({ ...p, portrait: { ...p.portrait, invert, enabled: true, ascii } }));
      setDirty(true);
    },
    [profile]
  );

  const forgetPhoto = useCallback(() => {
    photoRef.current = null;
    setHasPhoto(false);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      // Half-filled rows stay in the form but aren't worth persisting.
      const res = await saveProfile({
        ...profile,
        links: profile.links.filter((l) => l.label.trim() && l.url.trim()),
        projects: profile.projects.filter((p) => p.name.trim()),
      });
      setSavedAt(res.updatedAt);
      setDirty(false);
      setNotice("Profile saved to your FlowLens account.");
      try {
        localStorage.removeItem(draftKey(username));
      } catch {
        // ignore
      }
    } catch (err) {
      setError(errorMessage(err, "Couldn't save your profile."));
    } finally {
      setSaving(false);
    }
  }, [profile, username]);

  const remove = useCallback(async () => {
    setError(null);
    setNotice(null);
    try {
      await deleteSavedProfile();
      try {
        localStorage.removeItem(draftKey(username));
      } catch {
        // ignore
      }
      forgetPhoto();
      setProfile(defaultProfile(user ?? undefined));
      setSavedAt(null);
      setDirty(false);
      setNotice("Saved profile and local draft deleted.");
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete your saved profile."));
    }
  }, [username, user, forgetPhoto]);

  const calendarData = calendar.status === "ready" ? calendar.data : null;
  const output = useMemo(
    () => buildProfileExport(profile, username || "you", calendarData),
    [profile, username, calendarData]
  );

  return {
    profile,
    update,
    loading,
    saving,
    savedAt,
    dirty,
    error,
    notice,
    setError,
    calendar,
    loadCalendar,
    hasPhoto,
    applyPhoto,
    forgetPhoto,
    save,
    remove,
    output,
  };
}
