# OSHIRU project instructions

These instructions apply to every change in this repository.

1. Before changing code, read `docs/QUALITY_LESSONS.md` and identify the relevant recurrence-prevention rules.
2. Preserve every explicit user requirement. Do not change layout density, supported sources, interaction behavior, or release scope without recording the reason and obtaining approval when it materially changes the result.
3. Add every user-reported mistake to `docs/QUALITY_LESSONS.md` with: symptom, root cause, permanent fix, automated guard, and production evidence. A correction is not closed until all applicable fields have evidence.
4. Critical layout CSS and interaction JavaScript must be loaded deterministically from `index.html`. Do not depend on delayed DOM injection for first-render geometry or move card controls after first render.
5. Search changes must run merchandise-relevance regression tests, including ambiguous and generic-retail-noise cases. Do not present provider availability as relevance quality.
6. “Latest” official content must have an official source, a checked date, and a current sale/event period when the source publishes one. Expired entries must not be described as current.
7. Run `npm test`, relevant `node --check` commands, and `git diff --check` before release.
8. CI success and a deployment creation response are not production verification. Never report deployment complete until the exact URL `https://oshiruoshi.vercel.app` has been checked for the intended assets, API behavior, responsive layout, and intended Git commit/release marker. Record any item that could not be checked.

