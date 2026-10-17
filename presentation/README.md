# TutorConnect Nigeria — presentation source

The presentation deliverable is `TutorConnect-Nigeria-Edumentry-AI-Hackathon-1.0.pptx` (16 slides, with speaker notes).

## Rebuild

From the repository root, with Python 3 and `python-pptx` installed:

```bash
python3 -m pip install python-pptx
python3 presentation/build_deck.py
```

The deck uses the actual project assets in `public/images/`; its feature descriptions were cross-checked against source under `app/`, `components/`, `db/`, `lib/` and `package.json`.

Slide 2 is the speaker/role map; slide 7 introduces the technology stack by owner; and slides 8–12 are the named owners' consecutive technical sections. Slide 8 includes a clearly labelled explanatory interface mockup rather than a genuine website screenshot; it uses shipped component names and contains no live tutor records. The deck distinguishes implemented revenue inputs from proposed monetisation, reports testing evidence honestly, and describes Smart Tutor Match as deterministic rules-based matching—not machine learning. Speaker ownership in the deck describes presentation responsibilities, not a claim of isolated or commit-level authorship.
