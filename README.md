# Personal academic site — Hicham Eddoubi

Plain HTML/CSS/JS. No Jekyll, no build step, no dependencies. Drop it in a repo and turn on Pages.

## Deploy

1. Create a repo named `tsalmonking.github.io` (this gives you `https://tsalmonking.github.io`).
   Any other repo name works too — the site then lives at `https://tsalmonking.github.io/<repo>/`.
2. Copy the contents of this folder into the repo root (not the folder itself — `index.html` must sit at the top level).
3. Push, then go to **Settings → Pages** and set **Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait a minute; the site is live.

`.nojekyll` is included so GitHub serves the files as-is instead of running them through Jekyll.

To preview locally: `python3 -m http.server 8000` from this folder, then open `http://localhost:8000`.

## What to replace before publishing

| File | What |
|---|---|
| `assets/img/profile.jpg` | Placeholder. Swap in a square photo (800×800 or larger). Keep the filename or update `index.html`. |
| `assets/cv.pdf` | Not included. Add your CV PDF here, or delete that line from `cv.html`. |
| `cv.html` → Teaching | Empty section with a note. Fill in or delete. |
| `blog.html` + `posts/idealised-conditions.html` | One sample post, written to show the layout. Keep, rewrite, or delete both. |
| `feed.xml` | RSS feed. Update the URLs if you use a custom domain, and add an `<item>` per post. |
| `publications.html` | Venue for RAID is listed as the arXiv preprint. Update if it has a final venue. |
| `index.html` → News | Three entries. Add new ones at the top. |
| `index.html` → `<link rel="canonical">` | Points at `tsalmonking.github.io`. Change if you use a custom domain. |

## Structure

```
index.html               about page — bio, interests, news, links
blog.html                post index, newest first
posts/                   one HTML file per post
  _template.html         copy this to start a new post
  idealised-conditions.html   sample post
publications.html        grouped by year, newest first
projects.html            RAID, SecML-Torch, android-detectors
cv.html                  education, research, teaching, skills
feed.xml                 RSS
assets/css/main.css      single stylesheet, design tokens at the top
assets/js/main.js        theme toggle + portrait perturbation toggle
```

## Editing

All colours and typefaces are CSS custom properties at the top of `main.css`. Change `--accent` and the
whole site follows. Dark-mode values live in the `html[data-theme="dark"]` block right below.

The nav lives in each HTML file's `<header>`. Adding a page means copying that header block and setting
`aria-current="page"` on the right link.

### Adding a publication

Copy one `<article class="pub">` block in `publications.html` and edit it. Wrap your own name in
`<span class="me">` so it renders bold. Year headings are `<h2 class="pub-year">`.

### Writing a post

1. `cp posts/_template.html posts/my-post-title.html` — the filename becomes the URL.
2. Fill in the TODOs: `<title>`, the meta description, the date in both the `datetime`
   attribute and the visible text, reading time, tags, headline, body.
3. Add an `<li>` at the top of the `<ul class="post-list">` in `blog.html`, copying the
   existing one.
4. Add an `<item>` at the top of `feed.xml` if you want the post in the RSS feed.

The template includes every element the stylesheet supports — headings, lists, code blocks,
pull quotes, boxed callouts, captioned figures, footnotes. Delete what you don't use.

Images go in `assets/img/` and are referenced from a post as `../assets/img/name.png`.
Everything inside `posts/` needs that `../` prefix, including the stylesheet and script tags —
the template already has them right, so copy it rather than writing a post from scratch.

There is no post-count limit and no build step, but if you get past ~30 posts, hand-editing
`blog.html` every time gets tedious. That is the point at which switching to Jekyll (which
GitHub Pages runs natively) starts to pay for itself.

### The portrait toggle

The button under your photo applies an SVG displacement filter to the image — the photo as an adversarial
example, ε = 8/255. The filter is defined inline at the top of `index.html` (`<filter id="perturb">`);
`scale="5"` controls how strong it looks. To remove the whole thing, delete the `<p class="eps">` block,
the `<svg class="noise">` element, and the inline filter.

## Browser support

Works in current Chrome, Firefox, Safari and Edge. Theme choice is stored in `localStorage` and falls back
to your OS preference. Responsive down to ~320px, keyboard-focusable, respects `prefers-reduced-motion`.
