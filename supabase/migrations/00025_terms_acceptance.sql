-- Terms & Conditions acceptance tracking (spec Section 23).
-- Captured once, right after email verification, for both Users and
-- Scouts. terms_version lets us force re-acceptance later if the T&Cs
-- change materially (e.g. the planned ban-forfeiture policy shift) —
-- bump TERMS_VERSION in the mobile app and re-gate anyone whose stored
-- version doesn't match.

alter table profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text;

comment on column profiles.terms_accepted_at is
  'When the user accepted the current Terms & Conditions. Null means not yet accepted — client should route through /terms-and-conditions before granting app access.';
comment on column profiles.terms_version is
  'Version string of the T&Cs the user accepted, matched against the app''s current TERMS_VERSION to detect when re-acceptance is required.';
