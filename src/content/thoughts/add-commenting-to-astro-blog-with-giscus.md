---
title: "Add commenting to Astro blog with Giscus"
pubDate: 2024-01-11
description: "A guide to how I added commenting to this blog with Giscus."
author: "Bhekani Khumalo"
published: true
tags: ["astro", "blog", "tech"]
---

I initially added commenting to this blog using [Utteranc.es](https://utteranc.es) which uses GitHub issues for comments, then I later discovered [Giscus](https://giscus.app/) on [this](https://pierolescano.com/blog/adding_comments_to_my_blog/) blog post. Basically, giscuss does the same thing as utterances but it uses GitHub discussions instead of issues. The advantage with this is that they have a threading feature and it's easier to see what's going on in the thread. It also frees up issues to be used for actual issues.

## Setup

Setup is pretty straight forward. Just follow the guide on [the giscus website](https://giscus.app/), fill out the configuration and you should be given code that looks something like this:

```html
<script
  src="https://giscus.app/client.js"
  data-repo="bhekanik/bhekani.com"
  data-repo-id="R_kgDOLA66VA"
  data-category="Announcements"
  data-category-id="DIC_kwDOLA66VM4CcV11"
  data-mapping="url"
  data-strict="0"
  data-reactions-enabled="1"
  data-emit-metadata="1"
  data-input-position="top"
  data-theme="dark"
  data-lang="en"
  crossorigin="anonymous"
  async
></script>
```

But just throwing this into Astro won't work. So you'll need to create a new Astro component that wraps the giscus code. Let's call it `Giscus`.

```astro
<div id="giscuss-container" class="mt-8"></div>

<script>
  const script = document.createElement("script");
  const container = document.querySelector("#giscuss-container");

  Object.entries({
    src: "https://giscus.app/client.js",
    "data-repo": "bhekanik/bhekani.com",
    "data-repo-id": "R_kgDOLA66VA",
    "data-category": "Announcements",
    "data-category-id": "DIC_kwDOLA66VM4CcV11",
    "data-mapping": "url",
    "data-strict": "0",
    "data-reactions-enabled": "1",
    "data-emit-metadata": "1",
    "data-input-position": "top",
    "data-theme": "dark",
    "data-lang": "en",
    "data-loading": "lazy",
    crossorigin: "anonymous",
  }).forEach(([key, value]) => {
    script.setAttribute(key, value);
  });
  script.setAttribute("async", "true");

  container?.appendChild(script);
</script>
```

Then you can take the `Giscus` component and add it to your blog post as you would any other component. And that's it!

Try it out below!
