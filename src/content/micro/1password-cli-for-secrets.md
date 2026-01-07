---
title: "Using 1password CLI for secrets"
date: 2024-08-14
published: true
---

I use the same dotfiles for my work and person computers. Because we're using Github packages at work, I've had an annoying issue where I have to set the token for Github packages in my `.npmrc` file but I don't want to leak this token by checking it into Github so I reference an env variable. So my `.npmrc` file looks something like this: 

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_READ_TOKEN}
@contentful:registry=https://npm.pkg.github.com
loglevel=warn
```

But this meant that I have to manually set the NPM_TOKEN and GITHUB_PACKAGES_READ_TOKEN so that this file can find them in the environment. It's a small thing but it was annoying me. 

Today, I discovered that I can use the 1password CLI to set these values in my `.zshrc` and then I no longer have to think about it. Here's how to do it. 

1. Install the 1password CLI, you can find instructions [here](https://developer.1password.com/docs/cli/get-started)
2. Save the secrets in 1password
3. Then use [this](https://developer.1password.com/docs/cli/secret-reference-syntax) to learn how to get secret references from your 1password desktop app
4. Then add this to your .zshrc: 
```bash
export GITHUB_PACKAGES_READ_TOKEN=$(op read "op://<vault-name>/GITHUB_PACKAGES_READ_TOKEN/password")
export NPM_TOKEN=$(op read "op://<vault-name>/NPM_TOKEN/password")
```
5. Source your `.zshrc` and that's it.

There are other interesting commands in the 1password CLI like `op inject` if you want to inject your secrets into env files, etc. Check it out!
