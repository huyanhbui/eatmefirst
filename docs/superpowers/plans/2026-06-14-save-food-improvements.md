# Save Food Site Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship five improvements to the Save Food static site: a de-duplicated landing teaser, per-page header background photos, nine individual blog articles with fresh previews, a fixed blog grid, and working Google + GitHub social login.

**Architecture:** This is a static HTML site (Bootstrap 3 markup) re-skinned by `css/food-theme.css` on top of the template `css/style.css`, with a Firebase backend (Auth + Realtime Database) wired through `js/firebase-config.js`. All work is plain HTML/CSS/JS edits plus downloaded stock images — no build tooling, no framework. Social login reuses the existing Firebase config via a new ES module.

**Tech Stack:** HTML5, Bootstrap 3 CSS classes, vanilla CSS, Firebase JS SDK v10.4.0 (ES modules from gstatic CDN), Git Bash for image downloads.

**Verification note:** This repo has **no automated test runner** (it is a static site). "Tests" in this plan are concrete verification commands: `grep` assertions on the HTML/CSS, `curl`/file checks for images, and manual browser checks served via `python -m http.server 8000`. Firebase Auth popups require `http://localhost` — they do **not** work from `file://`.

**Spec:** `docs/superpowers/specs/2026-06-14-save-food-improvements-design.md`

---

## File structure

**Create:**
- `images/header-one-bg.jpg` … `header-five-bg.jpg` — five header background photos
- `images/blog-1.jpg` … `blog-9.jpg` — nine blog preview/article photos
- `images/project-1.jpg` … `project-6.jpg` — six portfolio detail-page photos
- `single-post-1.html` … `single-post-9.html` — nine article pages
- `js/auth-social.js` — Google + GitHub sign-in handler
- `SOCIAL-LOGIN-SETUP.md` — provider setup checklist

**Modify:**
- `js/comments.js` — per-post thread keying
- `blog.html` — grid columns, preview images, article links
- `css/food-theme.css` — per-page header background images + translucent header thumb
- `index.html` — replace duplicated `#intro` with a teaser
- `single-project.html`, `single-project 1 .html`, `single-project  2.html`, `single-project  3.html`, `single-project  4.html`, `single-project  5.html` — swap body image
- `log in.html`, `signup.html` — social buttons + module include
- `css/firebase-config.js` is **not** modified; `js/firebase-config.js` `friendlyAuthError` map is extended
- `css/auth-theme.css` — social button styles

---

## Task 1: Download all stock images

**Files:**
- Create: `images/header-one-bg.jpg`…`header-five-bg.jpg`, `images/blog-1.jpg`…`blog-9.jpg`, `images/project-1.jpg`…`project-6.jpg`

Images come from **loremflickr.com** (Creative-Commons Flickr photos by keyword — always returns HTTP 200, topical, freely usable). They are downloaded once and committed, so the site is self-contained. The user can swap any file later without code changes.

- [ ] **Step 1: Download the 20 images**

Run (Git Bash, from repo root):

```bash
set -e
dl() { curl -fsSL "https://loremflickr.com/1200/600/$2" -o "images/$1" && echo "ok $1"; }
dlp() { curl -fsSL "https://loremflickr.com/800/600/$2" -o "images/$1" && echo "ok $1"; }

# Header backgrounds (wide)
dl header-one-bg.jpg   "food,market"
dl header-two-bg.jpg   "vegetables,food"
dl header-three-bg.jpg "vegetables,fresh"
dl header-four-bg.jpg  "table,food"
dl header-five-bg.jpg  "kitchen,cooking"

# Blog previews / article images
dlp blog-1.jpg "food,waste"
dlp blog-2.jpg "market,vietnam"
dlp blog-3.jpg "rice,bowl"
dlp blog-4.jpg "refrigerator,vegetables"
dlp blog-5.jpg "milk,groceries"
dlp blog-6.jpg "kitchen,fridge"
dlp blog-7.jpg "cooking,vegetables"
dlp blog-8.jpg "landfill,waste"
dlp blog-9.jpg "groceries,shopping"

# Portfolio detail images
dlp project-1.jpg "food,waste"
dlp project-2.jpg "village,africa"
dlp project-3.jpg "market,vietnam"
dlp project-4.jpg "refrigerator,food"
dlp project-5.jpg "leftovers,cooking"
dlp project-6.jpg "kitchen,fridge"
```

- [ ] **Step 2: Verify every file exists and is a real, non-trivial JPEG**

Run:

```bash
cd images
fail=0
for f in header-one-bg.jpg header-two-bg.jpg header-three-bg.jpg header-four-bg.jpg header-five-bg.jpg \
         blog-1.jpg blog-2.jpg blog-3.jpg blog-4.jpg blog-5.jpg blog-6.jpg blog-7.jpg blog-8.jpg blog-9.jpg \
         project-1.jpg project-2.jpg project-3.jpg project-4.jpg project-5.jpg project-6.jpg; do
  if [ ! -f "$f" ]; then echo "MISSING $f"; fail=1; continue; fi
  size=$(wc -c < "$f")
  if [ "$size" -lt 5000 ]; then echo "TOO SMALL ($size) $f"; fail=1; fi
done
cd ..
[ "$fail" -eq 0 ] && echo "ALL IMAGES OK" || echo "IMAGE CHECK FAILED"
```

Expected: `ALL IMAGES OK`. If any file is missing/too small, re-run its `dl`/`dlp` line (loremflickr occasionally returns a transient error) until it passes.

- [ ] **Step 3: Commit**

```bash
git add images/header-one-bg.jpg images/header-two-bg.jpg images/header-three-bg.jpg images/header-four-bg.jpg images/header-five-bg.jpg images/blog-1.jpg images/blog-2.jpg images/blog-3.jpg images/blog-4.jpg images/blog-5.jpg images/blog-6.jpg images/blog-7.jpg images/blog-8.jpg images/blog-9.jpg images/project-1.jpg images/project-2.jpg images/project-3.jpg images/project-4.jpg images/project-5.jpg images/project-6.jpg
git commit -m "Add stock images for headers, blog previews and portfolio details"
```

---

## Task 2: Per-post comment threads

`js/comments.js` hard-codes one thread id. Each article needs its own thread so comments don't mix. The page supplies the id via `<body data-post-id="...">`.

**Files:**
- Modify: `js/comments.js:15`

- [ ] **Step 1: Replace the hard-coded POST_ID**

In `js/comments.js`, replace this line:

```js
// One comment thread per blog post. Change this string per page if you add more posts.
const POST_ID = "mid-autumn-festival";
```

with:

```js
// One comment thread per blog post, supplied by <body data-post-id="...">.
const POST_ID = (document.body && document.body.dataset.postId) || "general";
```

- [ ] **Step 2: Verify the change**

Run:

```bash
grep -n "dataset.postId" js/comments.js
```

Expected: one line printed showing the new code. Also confirm the old string is gone:

```bash
grep -n "mid-autumn-festival" js/comments.js || echo "OLD ID REMOVED"
```

Expected: `OLD ID REMOVED`.

- [ ] **Step 3: Commit**

```bash
git add js/comments.js
git commit -m "Key blog comments per-post via body data-post-id"
```

---

## Task 3: Create the nine article pages

Create `single-post-1.html` … `single-post-9.html` from the template below. Each page differs only in the six slots `{{TITLE}}`, `{{SUBTITLE}}`, `{{POST_ID}}`, `{{AUTHOR}}`, `{{DATE}}`, `{{IMAGE}}`, and `{{BODY}}`. All other markup (nav, footer, scripts, comments widget) is identical and copied verbatim from the template.

**Files:**
- Create: `single-post-1.html` … `single-post-9.html`

### Page template (fill the `{{...}}` slots from the content table)

```html
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=Edge">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="keywords" content="">
	<meta name="description" content="">
	<title>{{TITLE}} — Save Food</title>
	<link rel="stylesheet" href="css/bootstrap.min.css">
	<link rel="stylesheet" href="css/animate.min.css">
	<link rel="stylesheet" href="css/font-awesome.min.css">
	<link rel="stylesheet" href="css/ionicons.min.css">
	<link rel="stylesheet" href="css/style.css">
	<link rel="stylesheet" href="css/food-theme.css">
	<link href='https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700,300' rel='stylesheet' type='text/css'>
</head>
<body data-post-id="{{POST_ID}}">

<div class="preloader">
	<div class="sk-spinner sk-spinner-pulse"></div>
</div>

<div class="nav-container">
   <nav class="nav-inner transparent">
      <div class="navbar">
         <div class="container">
            <div class="row">
              <div class="brand">
                <a href="index.html">Save Food</a>
              </div>
              <div class="navicon">
                <div class="menu-container">
                  <div class="circle dark inline">
                    <i class="icon ion-navicon"></i>
                  </div>
                  <div class="list-menu">
                    <i class="icon ion-close-round close-iframe"></i>
                    <div class="intro-inner">
                     	<ul id="nav-menu">
                         <li><a href="index.html">Home</a></li>
                       	 <li><a href="about.html">About</a></li>
                       	 <li><a href="blog.html">Blog</a></li>
                       	 <li><a href="contact.html">Contact</a></li>
                       	 <li><a href="eatmefirst.html">EatMeFirst</a></li>
                       	 <li><a href="log in.html">login</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
         </div>
      </div>
   </nav>
</div>

<section id="header" class="header-five">
	<div class="container">
		<div class="row">
			<div class="col-md-offset-3 col-md-6 col-sm-offset-2 col-sm-8">
          <div class="header-thumb">
              <h1 class="wow fadeIn" data-wow-delay="0.6s">{{TITLE}}</h1>
              <h3 class="wow fadeInUp" data-wow-delay="0.9s">{{SUBTITLE}}</h3>
          </div>
			</div>
		</div>
	</div>
</section>

<section id="single-post">
   <div class="container">
      <div class="row">
         <div class="wow fadeInUp col-md-offset-1 col-md-10 col-sm-offset-1 col-sm-10" data-wow-delay="0.3s">
         	  <div class="blog-thumb">
         		   <h1>{{TITLE}}</h1>
         			    <div class="post-format">
						        <span>By <a href="#">{{AUTHOR}}</a></span>
						        <span><i class="fa fa-date"></i> {{DATE}}</span>
					       </div>
{{BODY}}

               <div class="blog-comment">
                 <h3>Comments</h3>
                 <div id="comment-list">
                   <p class="no-comments">Loading comments...</p>
                 </div>
               </div>

               <div class="blog-comment-form">
                  <h3>Leave a comment</h3>
                  <p id="comment-auth-status" style="margin-bottom:15px;">Checking your sign-in status...</p>
                    <form id="comment-form" action="#" method="post">
                      <textarea class="form-control" placeholder="Log in to comment" rows="5" id="comment-text" disabled required></textarea>
                      <div class="contact-submit">
                      	<input type="submit" class="form-control" id="comment-submit" value="Submit a comment" disabled>
                      </div>
                   </form>
               </div>
         	  </div>
		    </div>
      </div>
   </div>
</section>

<footer>
	<div class="container">
		<div class="row">
			<div class="col-md-12 col-sm-12">
				<p class="wow fadeInUp"  data-wow-delay="0.3s">Copyright © 2024 Save Food — together we waste less and feed more.</p>
				<ul class="social-icon wow fadeInUp"  data-wow-delay="0.6s">
					<li><a href="#" class="fa fa-facebook"></a></li>
					<li><a href="#" class="fa fa-twitter"></a></li>
					<li><a href="#" class="fa fa-dribbble"></a></li>
					<li><a href="#" class="fa fa-behance"></a></li>
					<li><a href="#" class="fa fa-google-plus"></a></li>
				</ul>
			</div>
		</div>
	</div>
</footer>

<script src="js/jquery.js"></script>
<script src="js/bootstrap.min.js"></script>
<script src="js/wow.min.js"></script>
<script src="js/custom.js"></script>
<script type="module" src="js/comments.js"></script>

</body>
</html>
```

The `{{BODY}}` slot is the article prose. Use this exact shape (paragraphs, one blockquote, the inline image positioned after the first or second paragraph):

```html
         		   <p>PARAGRAPH 1</p>
                   <blockquote>PULL QUOTE</blockquote>
         		   <p>PARAGRAPH 2</p>
                   <img src="images/{{IMAGE}}" class="img-responsive post-image" alt="{{TITLE}}">
         		   <p>PARAGRAPH 3</p>
```

For Post 6 only, add this button immediately after the last paragraph (it links to the tool):

```html
                   <p style="margin-top:18px;"><a href="eatmefirst.html" class="btn btn-default">Open EatMeFirst &rarr;</a></p>
```

### Content table

| File | POST_ID | IMAGE | AUTHOR | DATE | TITLE |
|------|---------|-------|--------|------|-------|
| single-post-1.html | post-1 | blog-1.jpg | Save Food Team | 12 June 2024 | Why a third of the world's food never gets eaten |
| single-post-2.html | post-2 | blog-2.jpg | Minh Tran | 10 June 2024 | The average Vietnamese family wastes 2.5 kg of food a week |
| single-post-3.html | post-3 | blog-3.jpg | Amara Okeke | 8 June 2024 | Hunger in Africa: the other side of the food crisis |
| single-post-4.html | post-4 | blog-4.jpg | Sandar | 6 June 2024 | 7 storage tricks that keep your food fresh for longer |
| single-post-5.html | post-5 | blog-5.jpg | Cindy | 4 June 2024 | "Best before" vs "use by": the labels that fool us |
| single-post-6.html | post-6 | blog-6.jpg | Linda | 2 June 2024 | Meet EatMeFirst: your free anti-waste fridge tracker |
| single-post-7.html | post-7 | blog-7.jpg | Bill Carter | 31 May 2024 | 5 easy recipes to use up leftovers tonight |
| single-post-8.html | post-8 | blog-8.jpg | Elena Rossi | 29 May 2024 | How food waste fuels climate change |
| single-post-9.html | post-9 | blog-9.jpg | Hoa Nguyen | 28 May 2024 | How to plan a week of meals and buy only what you need |

### Article copy (SUBTITLE + the three paragraphs + pull-quote per post)

**Post 1** — SUBTITLE: `The staggering scale of global food waste — and where it happens`
- P1: `Every year the world produces more than enough food to feed everyone alive — and then throws away roughly a third of it. That is about 1.3 billion tonnes of edible food lost or wasted annually, from farms and factories all the way to the back of our own fridges.`
- QUOTE: `We are not short of food. We are short of the will to stop wasting it.`
- P2: `The waste is spread across the whole journey: crops left unharvested for looking imperfect, produce bruised in transport, supermarket shelves cleared of "expired" stock, and meals scraped off plates into the bin. In wealthier countries, the single biggest culprit is the home kitchen.`
- P3: `The good news is that the part of the chain we control most directly — our own shopping, cooking and storage — is also the easiest to fix. Small habits add up fast, and tools like <a href="eatmefirst.html">EatMeFirst</a> make it simple to use what you already have before it spoils.`

**Post 2** — SUBTITLE: `A quiet habit that adds up to a national problem`
- P1: `Vietnam is among the highest food-wasting countries in Asia. An average household throws out around 2.5 kg of food every week — rice, vegetables, meat and leftovers — often without ever noticing.`
- QUOTE: `The cheapest food you will ever buy is the food you actually eat.`
- P2: `Multiply that across millions of homes and it becomes a national problem: wasted money for families and mountains of food rotting in landfill, releasing methane as it goes. Roughly a million đồng of food can end up in the bin each month from a single family.`
- P3: `Because this waste happens right in our kitchens, it is also the easiest to cut. Planning meals, storing food properly and keeping track of what you have can halve a household's waste in a matter of weeks.`

**Post 3** — SUBTITLE: `While some bin "imperfect" food, others go a day on a handful of rice`
- P1: `Around 282 million people in Africa face hunger. Across the continent, countless children grow up without a single reliable meal a day, while in other parts of the world tonnes of perfectly good food are discarded for looking imperfect.`
- QUOTE: `A world that wastes a third of its food has no excuse for hunger.`
- P2: `The two facts are linked. The modern food system grows more than enough for everyone, but wastes, mismanages and unevenly shares it. Cutting waste will not teleport food onto an empty plate — but it frees up the food, money, water and land that our system currently throws away.`
- P3: `Reducing waste at home is a small act with a wider meaning: it treats food as the precious, hard-won resource it is, and keeps the focus on a system that should feed people first.`

**Post 4** — SUBTITLE: `Simple habits that stop good food ending up in the bin`
- P1: `A surprising amount of food is wasted simply because it spoils before we get to it. A handful of storage habits can dramatically extend shelf life — and none of them cost a thing.`
- QUOTE: `Most food does not go bad. We just forget about it.`
- P2: `Keep herbs upright in a glass of water like flowers. Store potatoes and onions apart, somewhere cool and dark. Freeze bread you won't finish in a few days. Keep tomatoes out of the fridge for flavour, leafy greens in it with a dry paper towel to soak up moisture, and apples away from other produce so they don't speed up ripening.`
- P3: `Finally, label leftovers with a date so nothing becomes a mystery at the back of the shelf. Pair these habits with a quick check of what needs eating first, and very little will ever reach the bin.`

**Post 5** — SUBTITLE: `One is about safety, the other is just about quality`
- P1: `A huge amount of edible food is thrown away over confusing date labels. The two main labels mean very different things, and knowing the difference saves both food and money.`
- QUOTE: `"Best before" is a suggestion. "Use by" is a deadline.`
- P2: `"Use by" is about safety — eat or freeze the food by that date. "Best before" is about quality: the food may be past its peak but is usually perfectly safe well beyond it. A "best before" date on rice, pasta or tinned beans is almost meaningless if they have been stored properly.`
- P3: `For everything outside the "use by" category, trust your senses. Look, smell and taste before you bin. Your eyes and nose are far better judges of a yogurt or a loaf of bread than a date guessed at months in advance.`

**Post 6** — SUBTITLE: `Because forgetting what you have is the #1 cause of home food waste`
- P1: `Most household food waste comes down to one simple thing: we forget what we already have. EatMeFirst is a free tool built to fix exactly that.`
- QUOTE: `You cannot eat what you forget you own.`
- P2: `Add what's in your kitchen and EatMeFirst sorts everything by what to eat first, warns you before food expires, suggests "use-it-up" meals, and counts the money you save from the bin. Less waste, more meals, no guilt.`
- P3: `It takes a minute to start and works with whatever you already have at home — no special shopping required.` *(remember to add the EatMeFirst button after this paragraph, per the template note)*

**Post 7** — SUBTITLE: `Turn tired odds and ends into a great meal instead of trash`
- P1: `Leftovers get a bad reputation, but they are the foundation of some of the best fast, forgiving meals. Here are five templates that turn whatever is hanging around into dinner.`
- QUOTE: `There is no such thing as boring leftovers, only uninspired ones.`
- P2: `Fried rice rescues yesterday's rice with any veg and a couple of eggs. A frittata absorbs odd vegetables, cheese ends and cooked potato. A pot of soup happily takes wilting greens and tired roots. Smoothies use up soft, spotty fruit. And a "clean-out-the-fridge" grain bowl pulls everything together with a quick dressing.`
- P3: `None of these need a precise recipe — they are starting points. Once you start cooking this way, the bin gets a lot emptier and weeknight dinners get a lot easier.`

**Post 8** — SUBTITLE: `If food waste were a country, it would be the third-largest emitter on Earth`
- P1: `Food waste is not just a moral or money problem — it is a climate one. If food waste were a country, it would be the third-largest source of greenhouse gas emissions, behind only China and the United States.`
- QUOTE: `Throwing away food throws away everything it took to make it.`
- P2: `Every wasted item carries a hidden footprint: the water, land, fuel and labour used to grow, harvest and transport it, all spent for nothing. Worse, food rotting in landfill releases methane, a greenhouse gas far more potent than carbon dioxide over the short term.`
- P3: `Cutting household waste is one of the most accessible climate actions there is. It needs no new technology and no big budget — just using what we buy. Eat what you have, and the planet quietly benefits.`

**Post 9** — SUBTITLE: `A little planning before you shop is the single biggest way to cut waste`
- P1: `The biggest savings happen before you ever open the fridge. A few minutes of planning before you shop is the single most effective way to cut food waste.`
- QUOTE: `Shop your fridge before you shop the store.`
- P2: `Start by checking what you already have, then plan a handful of meals around it. Write a list and stick to it — most waste begins as an impulse buy that never gets cooked. Build in one flexible "leftovers night" so nothing lingers, and buy perishable items in amounts you'll realistically finish.`
- P3: `It feels like a small ritual, but it changes everything downstream: less money spent, less food binned, and far fewer sad, forgotten vegetables at the back of the drawer.`

- [ ] **Step 1: Create all nine pages** using the template + content table + article copy above.

- [ ] **Step 2: Verify every page exists with the right id, title and image**

Run:

```bash
for n in 1 2 3 4 5 6 7 8 9; do
  f="single-post-$n.html"
  [ -f "$f" ] || { echo "MISSING $f"; continue; }
  grep -q "data-post-id=\"post-$n\"" "$f" && grep -q "images/blog-$n.jpg" "$f" \
    && echo "ok $f" || echo "CHECK FAILED $f"
done
```

Expected: `ok single-post-1.html` … `ok single-post-9.html`. Confirm Post 6 has the tool button:

```bash
grep -c "eatmefirst.html" single-post-6.html
```

Expected: `2` (the nav link + the in-article button).

- [ ] **Step 3: Browser check (manual)**

Run a local server and open one page:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/single-post-3.html`. Expected: header photo with green tint, the article text for Post 3, the inline image, and a "Loading comments..." → comments widget that says to log in.

- [ ] **Step 4: Commit**

```bash
git add single-post-1.html single-post-2.html single-post-3.html single-post-4.html single-post-5.html single-post-6.html single-post-7.html single-post-8.html single-post-9.html
git commit -m "Add nine individual blog article pages"
```

---

## Task 4: Fix blog grid + rewire previews and links

`blog.html` currently uses mismatched columns (`col-md-6/6/4/4/4/3/3/3/3`), points every card at `single-post.html`, and uses old preview images. Standardize to a clean 3-across grid and wire each card to its own page and preview.

**Files:**
- Modify: `blog.html:119-246`

- [ ] **Step 1: Rewrite the blog grid**

Replace the entire `<section id="blog"> … </section>` block (currently `blog.html:119-246`) with:

```html
<section id="blog">
   <div class="container">
      <div class="row">

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.2s">
            <div class="blog-thumb">
               <a href="single-post-1.html"><img src="images/blog-1.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-1.html"><h1>Why a third of the world's food never gets eaten</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Save Food Team</a></span>
                  <span><i class="fa fa-date"></i> 12 June 2024</span>
               </div>
               <p>Every year about 1.3 billion tonnes of perfectly good food is thrown away — while millions go hungry. Here's how the waste happens, and why it matters to all of us.</p>
               <a href="single-post-1.html" class="btn btn-default">Full Article</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.3s">
            <div class="blog-thumb">
               <a href="single-post-2.html"><img src="images/blog-2.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-2.html"><h1>The average Vietnamese family wastes 2.5 kg of food a week</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Minh Tran</a></span>
                  <span><i class="fa fa-date"></i> 10 June 2024</span>
               </div>
               <p>Vietnam is one of Asia's biggest food wasters. We break down what households throw away each week — and the simple habits that can cut it in half.</p>
               <a href="single-post-2.html" class="btn btn-default">Read More</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.4s">
            <div class="blog-thumb">
               <a href="single-post-3.html"><img src="images/blog-3.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-3.html"><h1>Hunger in Africa: the other side of the food crisis</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Amara Okeke</a></span>
                  <span><i class="fa fa-date"></i> 8 June 2024</span>
               </div>
               <p>Around 282 million people in Africa face hunger. While we bin "imperfect" food, children elsewhere go a whole day on a handful of rice. The link is closer than you think.</p>
               <a href="single-post-3.html" class="btn btn-default">Details</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.2s">
            <div class="blog-thumb">
               <a href="single-post-4.html"><img src="images/blog-4.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-4.html"><h1>7 storage tricks that keep your food fresh for longer</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Sandar</a></span>
                  <span><i class="fa fa-date"></i> 6 June 2024</span>
               </div>
               <p>From keeping herbs in water to freezing bread, small storage habits dramatically extend shelf life — and stop good food ending up in the bin.</p>
               <a href="single-post-4.html" class="btn btn-default">Read More</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.3s">
            <div class="blog-thumb">
               <a href="single-post-5.html"><img src="images/blog-5.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-5.html"><h1>"Best before" vs "use by": the labels that fool us</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Cindy</a></span>
                  <span><i class="fa fa-date"></i> 4 June 2024</span>
               </div>
               <p>A huge amount of edible food is binned over confusing date labels. Learn the real difference between "best before" and "use by" — and trust your senses again.</p>
               <a href="single-post-5.html" class="btn btn-default">Full Story</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.4s">
            <div class="blog-thumb">
               <a href="single-post-6.html"><img src="images/blog-6.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-6.html"><h1>Meet EatMeFirst: your free anti-waste fridge tracker</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Linda</a></span>
                  <span><i class="fa fa-date"></i> 2 June 2024</span>
               </div>
               <p>Forgetting what's in the fridge is the #1 cause of home food waste. See how our free EatMeFirst tool tells you what to eat first and tracks what you save.</p>
               <a href="single-post-6.html" class="btn btn-default">Read More</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.2s">
            <div class="blog-thumb">
               <a href="single-post-7.html"><img src="images/blog-7.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-7.html"><h1>5 easy recipes to use up leftovers tonight</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Bill Carter</a></span>
                  <span><i class="fa fa-date"></i> 31 May 2024</span>
               </div>
               <p>Fried rice, frittata, soup, smoothies and "clean-out-the-fridge" bowls — five forgiving recipes that turn tired leftovers into a great meal instead of trash.</p>
               <a href="single-post-7.html" class="btn btn-default">Details</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.3s">
            <div class="blog-thumb">
               <a href="single-post-8.html"><img src="images/blog-8.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-8.html"><h1>How food waste fuels climate change</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Elena Rossi</a></span>
                  <span><i class="fa fa-date"></i> 29 May 2024</span>
               </div>
               <p>If food waste were a country, it would be the third-largest emitter of greenhouse gases on Earth. Rotting food in landfill releases methane — a powerful climate pollutant.</p>
               <a href="single-post-8.html" class="btn btn-default">Read More</a>
            </div>
         </div>

         <div class="wow fadeInUp col-md-4 col-sm-6" data-wow-delay="0.4s">
            <div class="blog-thumb">
               <a href="single-post-9.html"><img src="images/blog-9.jpg" class="img-responsive" alt="Blog"></a>
               <a href="single-post-9.html"><h1>How to plan a week of meals and buy only what you need</h1></a>
               <div class="post-format">
                  <span>By <a href="#">Hoa Nguyen</a></span>
                  <span><i class="fa fa-date"></i> 28 May 2024</span>
               </div>
               <p>A little planning before you shop is the single biggest way to cut waste. Here's a simple weekly system for buying, cooking and finishing everything you bring home.</p>
               <a href="single-post-9.html" class="btn btn-default">Details</a>
            </div>
         </div>

      </div>
   </div>
</section>
```

- [ ] **Step 2: Verify grid, links and previews**

Run:

```bash
echo "col-md-4 count: $(grep -c 'col-md-4 col-sm-6' blog.html) (expect 9)"
echo "old single-post.html links: $(grep -c 'href="single-post.html"' blog.html) (expect 0)"
echo "new post links: $(grep -c 'single-post-[1-9].html' blog.html) (expect 27)"
echo "old previews remaining: $(grep -cE 'images/[1-9]\.(jpg|png)' blog.html) (expect 0)"
```

Expected: `9`, `0`, `27` (3 links per card × 9), `0`.

- [ ] **Step 3: Browser check (manual)**

With `python -m http.server 8000` running, open `http://localhost:8000/blog.html`. Expected: a tidy 3-column grid of 9 equal cards; each "Full Article / Read More / Details" button and image opens the matching `single-post-N.html`.

- [ ] **Step 4: Commit**

```bash
git add blog.html
git commit -m "Fix blog grid to even 3-column layout; wire cards to individual posts"
```

---

## Task 5: Per-page header background photos

Give each header class its own downloaded photo and make the inner `.header-thumb` translucent so the photo shows through. All edits go in the override file `css/food-theme.css` (template `style.css` stays untouched). The green-multiply overlay already exists in `food-theme.css` (the `.header-one … .header-five` block) and will tint each photo automatically.

**Files:**
- Modify: `css/food-theme.css` (the existing `.header-one, … .header-five` overlay block near the top, and the `#header .header-thumb` block near line 110)

- [ ] **Step 1: Add per-class background images to the overlay block**

In `css/food-theme.css`, find this existing block:

```css
/* Subtle green wash over the header photos so they feel on-theme */
.header-one, .header-two, .header-three, .header-four, .header-five {
  background-color: rgba(27, 94, 32, 0.45) !important;
  background-blend-mode: multiply;
  background-size: cover !important;
  background-position: center !important;
}
```

Immediately **after** it, add:

```css
/* Per-page header photos (downloaded into images/). The green wash above
   multiplies over each one so white heading text stays readable. */
.header-one   { background-image: url('../images/header-one-bg.jpg')   !important; }
.header-two   { background-image: url('../images/header-two-bg.jpg')   !important; }
.header-three { background-image: url('../images/header-three-bg.jpg') !important; }
.header-four  { background-image: url('../images/header-four-bg.jpg')  !important; }
.header-five  { background-image: url('../images/header-five-bg.jpg')  !important; }
```

- [ ] **Step 2: Make the header thumb translucent**

In `css/food-theme.css`, find this block (near line 110):

```css
/* ---- Hero header box ---- */
#header .header-thumb {
  border: none !important;
  border-radius: 20px !important;
  padding: 46px 34px !important;
  background: linear-gradient(135deg, var(--leaf) 0%, var(--leaf-dark) 100%) !important;
  box-shadow: 0 20px 50px rgba(27, 94, 32, 0.28) !important;
}
```

Replace the `background:` and `box-shadow:` lines so the photo shows through a translucent panel:

```css
/* ---- Hero header box (translucent so the page photo shows through) ---- */
#header .header-thumb {
  border: none !important;
  border-radius: 20px !important;
  padding: 46px 34px !important;
  background: rgba(20, 70, 26, 0.55) !important;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  box-shadow: 0 20px 50px rgba(27, 94, 32, 0.28) !important;
}
```

- [ ] **Step 3: Verify the CSS**

Run:

```bash
echo "bg-image rules: $(grep -cE \"header-(one|two|three|four|five)\b.*background-image\" css/food-theme.css) (expect 5)"
grep -q "rgba(20, 70, 26, 0.55)" css/food-theme.css && echo "translucent thumb OK" || echo "THUMB NOT UPDATED"
```

Expected: `5` and `translucent thumb OK`.

- [ ] **Step 4: Browser check (manual)**

With the server running, open `http://localhost:8000/index.html`, `about.html`, `blog.html`, `contact.html`, and one `single-project*.html`. Expected: each header shows a different green-tinted photo behind a translucent panel, with white heading text clearly readable.

- [ ] **Step 5: Commit**

```bash
git add css/food-theme.css
git commit -m "Give each page header a photo background with translucent title panel"
```

---

## Task 6: Landing page teaser (de-duplicate from About)

Replace the `#intro` section in `index.html` (which repeats the About stats/explanation) with a short teaser that points to About and EatMeFirst. Keep the portfolio grid and the EatMeFirst CTA section that follow it.

**Files:**
- Modify: `index.html:117-161`

- [ ] **Step 1: Replace the `#intro` section**

Replace the entire `<section id="intro"> … </section>` block (currently `index.html:117-161`) with:

```html
<section id="intro">
   <div class="container">
      <div class="row">

         <div class="col-md-offset-1 col-md-10 text-center wow fadeInUp" data-wow-delay="0.3s">
            <p class="FaQ">THE BIG PICTURE</p>
            <h1 class="intro-title">A third of the world's food is thrown away — let's start with your kitchen.</h1>
            <p class="intro-lead">Save Food is a simple mission: waste less, feed more. Most food is wasted at home,
               simply because we forget what we have — which means it's also the easiest waste to fix.</p>
         </div>

         <div class="clearfix"></div>

         <div class="col-md-12 text-center wow fadeInUp" data-wow-delay="0.5s">
            <p class="intro-cta-line">Want the full story behind food waste and hunger?</p>
            <a href="about.html" class="intro-btn">Read about our mission</a>
            <a href="eatmefirst.html" class="intro-btn">Start saving with EatMeFirst</a>
         </div>

      </div>
   </div>
</section>
```

- [ ] **Step 2: Verify the duplication is gone**

Run:

```bash
echo "stat-card on landing: $(grep -c 'stat-card' index.html) (expect 0)"
echo "links present: about=$(grep -c 'about.html\" class=\"intro-btn' index.html) eat=$(grep -c 'eatmefirst.html\" class=\"intro-btn' index.html) (expect 1 and 1)"
```

Expected: `0`, then `about=1 eat=1`. (The three duplicated `stat-card` blocks must be gone from the landing page; they remain on About.)

- [ ] **Step 3: Browser check (manual)**

Open `http://localhost:8000/index.html`. Expected: a short hero/teaser with two buttons ("Read about our mission" → about.html, "Start saving with EatMeFirst" → eatmefirst.html), followed by the unchanged 6-card story grid and EatMeFirst CTA.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Replace landing intro with teaser; remove About duplication"
```

---

## Task 7: Swap portfolio detail-page images

All six `single-project*.html` pages show `images/cake_1_0.jpg`, which doesn't match their topics. Point each at its `project-N.jpg`. (The landing-page thumbnails are intentionally left unchanged.)

**Files:**
- Modify: `single-project.html:145`, `single-project 1 .html:147`, `single-project  2.html:147`, `single-project  3.html:147`, `single-project  4.html:147`, `single-project  5.html:147`

- [ ] **Step 1: Replace the body image in each page**

Make these exact edits (note the literal spaces in some filenames):

- `single-project.html` — change `src="images/cake_1_0.jpg"` → `src="images/project-1.jpg"`
- `single-project 1 .html` — change `src="images/cake_1_0.jpg"` → `src="images/project-2.jpg"`
- `single-project  2.html` — change `src="images/cake_1_0.jpg"` → `src="images/project-3.jpg"`
- `single-project  3.html` — change `src="images/cake_1_0.jpg"` → `src="images/project-4.jpg"`
- `single-project  4.html` — change `src="images/cake_1_0.jpg"` → `src="images/project-5.jpg"`
- `single-project  5.html` — change `src="images/cake_1_0.jpg"` → `src="images/project-6.jpg"`

- [ ] **Step 2: Verify no page still references the old image**

Run:

```bash
grep -rl "cake_1_0.jpg" single-project*.html && echo "STILL PRESENT — fix above" || echo "ALL SWAPPED"
for n in 1 2 3 4 5 6; do grep -rl "images/project-$n.jpg" single-project*.html >/dev/null && echo "project-$n used"; done
```

Expected: `ALL SWAPPED`, then `project-1 used` … `project-6 used`.

- [ ] **Step 3: Commit**

```bash
git add "single-project.html" "single-project 1 .html" "single-project  2.html" "single-project  3.html" "single-project  4.html" "single-project  5.html"
git commit -m "Swap portfolio detail-page images for topic-matched photos"
```

---

## Task 8: Google + GitHub social login

Add a shared social-login module and "Continue with" buttons to both auth pages. Reuses the existing `js/firebase-config.js` exports. Email/password handlers are untouched.

**Files:**
- Create: `js/auth-social.js`
- Modify: `js/firebase-config.js` (extend the `friendlyAuthError` map)
- Modify: `log in.html`, `signup.html` (buttons + module include)
- Modify: `css/auth-theme.css` (button styles)

- [ ] **Step 1: Extend the error map**

In `js/firebase-config.js`, inside the `map` object in `friendlyAuthError`, add these two entries (after the existing `"auth/network-request-failed"` line):

```js
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/cancelled-popup-request": "Sign-in was cancelled.",
    "auth/account-exists-with-different-credential":
      "You already have an account with this email using a different sign-in method.",
```

- [ ] **Step 2: Create `js/auth-social.js`**

```js
// Shared Google + GitHub sign-in for the login and signup pages.
// Loaded as a module from "log in.html" and "signup.html".
import { auth, db, friendlyAuthError } from "./firebase-config.js";
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// Save a profile record the first time a social user signs in.
async function upsertUser(user) {
  const userRef = ref(db, "users/" + user.uid);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await set(userRef, {
      name: user.displayName || "",
      email: user.email || "",
      createdAt: Date.now(),
    });
  }
}

async function socialLogin(provider) {
  try {
    const cred = await signInWithPopup(auth, provider);
    await upsertUser(cred.user);
    window.location.replace("index.html");
  } catch (error) {
    alert(friendlyAuthError(error.code));
  }
}

const googleBtn = document.getElementById("google-login");
const githubBtn = document.getElementById("github-login");

if (googleBtn) {
  googleBtn.addEventListener("click", () => socialLogin(new GoogleAuthProvider()));
}
if (githubBtn) {
  githubBtn.addEventListener("click", () => socialLogin(new GithubAuthProvider()));
}
```

- [ ] **Step 3: Add buttons + module include to `log in.html`**

In `log in.html`, immediately **after** the closing `</form>` of `#signup-form` (after the line with `Sign in` submit's `</form>`, before the `<p class="loginhere">`), insert:

```html
                    <div class="auth-divider"><span>or continue with</span></div>
                    <div class="social-auth">
                        <button type="button" id="google-login" class="social-btn google"><i class="zmdi zmdi-google"></i> Google</button>
                        <button type="button" id="github-login" class="social-btn github"><i class="zmdi zmdi-github"></i> GitHub</button>
                    </div>
```

Then, before `</body>`, after the existing `<script type="module" src="js/auth-login.js"></script>` line, add:

```html
    <script type="module" src="js/auth-social.js"></script>
```

- [ ] **Step 4: Add buttons + module include to `signup.html`**

In `signup.html`, the buttons live inside the form. Immediately **after** the submit `<div class="form-group"> … value="Sign up" … </div>` and **before** the `<p class="loginhere">`, insert:

```html
                        <div class="auth-divider"><span>or sign up with</span></div>
                        <div class="social-auth">
                            <button type="button" id="google-login" class="social-btn google"><i class="zmdi zmdi-google"></i> Google</button>
                            <button type="button" id="github-login" class="social-btn github"><i class="zmdi zmdi-github"></i> GitHub</button>
                        </div>
```

Then, before `</body>`, after the existing `<script type="module" src="js/auth-signup.js"></script>` line, add:

```html
    <script type="module" src="js/auth-social.js"></script>
```

- [ ] **Step 5: Add button styles to `css/auth-theme.css`**

Append to the end of `css/auth-theme.css` (before the final `@media` block is fine; appending at the very end also works):

```css
/* ---- Social sign-in ---- */
.auth-divider {
  display: flex; align-items: center; text-align: center;
  color: #9aa89b; margin: 22px 0 16px; font-size: 0.85rem;
}
.auth-divider::before, .auth-divider::after {
  content: ""; flex: 1; height: 1px; background: #e0e9dd;
}
.auth-divider span { padding: 0 12px; }

.social-auth { display: flex; gap: 12px; }
.social-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 10px; border-radius: 12px; border: 1.5px solid #dbe5d8;
  background: #fff; color: #243528; font-weight: 700; font-size: 14px; cursor: pointer;
  transition: border-color .15s ease, box-shadow .15s ease, transform .1s ease;
}
.social-btn:hover {
  border-color: #2e7d32; box-shadow: 0 6px 16px rgba(27, 94, 32, .14);
  transform: translateY(-1px);
}
.social-btn i { font-size: 18px; }
.social-btn.google i { color: #ea4335; }
.social-btn.github i { color: #1b1f23; }
```

- [ ] **Step 6: Verify wiring**

Run:

```bash
echo "module on both pages: $(grep -c 'auth-social.js' 'log in.html') + $(grep -c 'auth-social.js' signup.html) (expect 1 and 1)"
echo "buttons login: $(grep -c 'id=\"google-login\"\|id=\"github-login\"' 'log in.html') (expect 2)"
echo "buttons signup: $(grep -c 'id=\"google-login\"\|id=\"github-login\"' signup.html) (expect 2)"
grep -q "GithubAuthProvider" js/auth-social.js && echo "module OK"
grep -q "popup-closed-by-user" js/firebase-config.js && echo "error map OK"
```

Expected: `1 and 1`, `2`, `2`, `module OK`, `error map OK`.

- [ ] **Step 7: Browser check (manual — requires console setup from Task 9)**

With `python -m http.server 8000` running, open `http://localhost:8000/log in.html`. Expected: a divider and two styled buttons (red Google glyph, dark GitHub glyph). Clicking **Google** opens the Firebase popup **only after** Google is enabled in the Firebase Console (Task 9); GitHub works once its OAuth app is registered. Before that setup, a click shows a friendly error — that is expected, not a bug.

- [ ] **Step 8: Commit**

```bash
git add js/auth-social.js js/firebase-config.js "log in.html" signup.html css/auth-theme.css
git commit -m "Add Google and GitHub social login to auth pages"
```

---

## Task 9: Social-login setup doc

Document the console steps the user must complete (these cannot be done in code).

**Files:**
- Create: `SOCIAL-LOGIN-SETUP.md`

- [ ] **Step 1: Create `SOCIAL-LOGIN-SETUP.md`**

```markdown
# Social Login Setup (Google + GitHub)

The buttons and code are already wired up. To make them work, finish these steps
in the provider consoles. **Important:** social sign-in popups only work when the
site is served over `http`/`https` — open it via a local server, e.g.
`python -m http.server 8000`, then visit `http://localhost:8000/log in.html`.
They do **not** work by double-clicking the HTML file (`file://`).

Firebase project: **asia-festival** (see `js/firebase-config.js`).

## 1. Google (free, ~2 minutes)
1. Open the [Firebase Console](https://console.firebase.google.com/) → project
   **asia-festival**.
2. Build → **Authentication** → **Sign-in method**.
3. Click **Google** → **Enable** → pick a support email → **Save**.
4. Done. The Google button now works on `http://localhost`.

## 2. GitHub (free, ~5 minutes)
1. On GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Application name: `Save Food`
   - Homepage URL: `http://localhost:8000`
   - Authorization callback URL:
     `https://asia-festival.firebaseapp.com/__/auth/handler`
   - Register, then copy the **Client ID** and generate a **Client secret**.
2. Firebase Console → **Authentication → Sign-in method → GitHub → Enable**.
   Paste the Client ID and Client secret → **Save**.
3. Done. The GitHub button now works on `http://localhost`.

## 3. Authorized domains
`localhost` is authorized by default. When you deploy, add your real domain under
Firebase Console → Authentication → Settings → **Authorized domains**.

## Not included yet
Apple and Facebook were intentionally left out. Apple requires a paid Apple
Developer account ($99/yr); Facebook requires a Meta Developer app and review.
The button row is easy to extend later — add a button with `id="apple-login"` /
`id="facebook-login"` and the matching provider in `js/auth-social.js`.
```

- [ ] **Step 2: Verify**

Run:

```bash
test -f SOCIAL-LOGIN-SETUP.md && grep -q "asia-festival.firebaseapp.com/__/auth/handler" SOCIAL-LOGIN-SETUP.md && echo "DOC OK"
```

Expected: `DOC OK`.

- [ ] **Step 3: Commit**

```bash
git add SOCIAL-LOGIN-SETUP.md
git commit -m "Document Google + GitHub login setup steps"
```

---

## Final verification (all tasks)

- [ ] **Run the full static check**

```bash
echo "== images ==" && ls images/header-*-bg.jpg images/blog-*.jpg images/project-*.jpg | wc -l   # expect 20
echo "== posts ==" && ls single-post-[1-9].html | wc -l                                            # expect 9
echo "== blog grid ==" && grep -c 'col-md-4 col-sm-6' blog.html                                    # expect 9
echo "== no old previews ==" && grep -cE 'images/[1-9]\.(jpg|png)' blog.html                        # expect 0
echo "== headers ==" && grep -cE 'header-(one|two|three|four|five)\b.*background-image' css/food-theme.css  # expect 5
echo "== landing dedup ==" && grep -c 'stat-card' index.html                                       # expect 0
echo "== social module ==" && grep -c 'auth-social.js' 'log in.html' signup.html                   # expect 1 each
echo "== no cake image ==" && (grep -rl cake_1_0.jpg single-project*.html || echo none)            # expect none
```

- [ ] **Manual browser pass** with `python -m http.server 8000`: visit `index.html`, `about.html`, `blog.html` (→ open 2–3 posts), `contact.html`, a `single-project*.html`, and `log in.html`. Confirm distinct header photos, even blog grid, working post links, and styled social buttons.

- [ ] **Social login live test** after completing `SOCIAL-LOGIN-SETUP.md`: click Google and GitHub on `http://localhost:8000/log in.html` and confirm sign-in redirects to `index.html`.
