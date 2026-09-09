# Package the AI OS kit

The current `0.4.0-k4` version is a delivery candidate, not a fully verified parity release. Read [capability status](../kit/capabilities.md) and [K4 evidence](k4-verification.md).

From a trusted checkout, export a selected committed revision with Git. This includes the kit, source, documentation, original license and viewer notices without personal workspaces or build dependencies:

```bash
git archive --format=zip --prefix=manu-control-center/ --output=/absolute/output/manu-control-center.zip HEAD
```

Unpack into a new directory and follow [START-HERE](../kit/START-HERE.md). Keep the complete `kit/` directory together when distributing it separately. The prebuilt explorer bundle must remain at `kit/explorer/template/dist/app.js`. Never substitute a personal `.mcc/` installation for the distribution: it may contain private context and generated data.

Before publishing, run the documentation, installer and optional-view checks from [development](development.md) in the clean export, then preview/install both entries into a separate synthetic workspace. Actual host checks remain separate from packaging. No binary release or stable-version claim is implied by producing a ZIP.
