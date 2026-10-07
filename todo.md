# Website todo

## Blog
- [ ] Write "How do we refocus the blurred line between fakes and reals" (`posts/blurred-line.html`)
  - AIGI detectors online behave like LLM text detectors under adversarial pressure: trivially evaded
  - Argument: detection trend shifts toward provenance (C2PA, watermarking, etc.)
  - Pull material from slides
  - Fill in meta description, og:description, standfirst, tags, reading time, and the `feed.xml` description

## Portrait: real vs AI-generated vs perturbed
- [ ] Generate AIGI image of me flying in the sky → `assets/img/he-aigi.png` (PNG, square, ≥512px)
- [ ] Produce adversarial version at ε = 16/255 → `assets/img/he-aigi-adv.png` (PNG — JPEG kills the perturbation)
- [ ] Verify the perturbed image actually evades the online detectors we link (they may resize/re-encode)
- [ ] Pick which online detectors visitors should test on
- [ ] Build the toggle on the about page: real → AI-generated → perturbed, with download + "test it yourself" links
  - Label must state the real ε and attack used (old placeholder said ε = 8/255 with a fake SVG noise filter — removed)

## Housekeeping
- [ ] Delete unused `assets/img/profile.jpg` (old placeholder)
- [ ] Add `.DS_Store` to `.gitignore`
- [ ] Higher-res Scholar photo? `he.jpg` is 256×256, slightly soft on retina
