---
title: "How to sign Git commits with SSH keys"
pubDate: 2024-02-10
published: true
author: "Bhekani Khumalo"
tags: ["blog", "git", "til"]
---

## Why?

Git was not initially designed with strong mechanisms for verifying the authenticity of committers. It's surprisingly simple for anyone to impersonate another user by altering their commit author name and email settings. For instance, by running:

```bash
git config user.name "William Henry Gates III"
git config user.email "bill@microsoft.com"
```

anyone can misleadingly commit changes under Bill Gates' name. This poses a security concern, highlighting the necessity for a reliable method to authenticate the true identity behind each commit's author. This is where signed commits come in.

They use cryptographic signatures to confirm that a commit was made by the actual individual it claims to originate from. Various cryptographic methods, such as GPG (GNU Privacy Guard), X.509, S/MIME, and SSH, can be used for this. Among these, GPG is the most common but it's known to be finicky especially for new users. Since Git 2.34.0, SSH can now be used to sign commits. SSH is notably straightforward and is already used in most cases for Git's existing verification processes.

## How to Implement SSH Key Signing for Git Commits?

### Creating an SSH key

First of all, ensure that you have Git 2.34.0 or newer installed. Then configure Git with your name and email address as follows:

```bash
git config user.name "Your Name"
git config user.email "Your Email"
```

Then generate an SSH key using the following commands:

```bash
ssh-keygen -t ed25519 -C "Your Email"
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

Now, start up the SSH agent and add the SSH key to it. You can do that with the following command:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Next, create a file containing the SSH public key that will be used for verifying signers:

```bash
awk '{ print $3 " " $1 " " $2 }' ~/.ssh/id_ed25519.pub >> ~/.ssh/allowed_signers
```

You are now ready to sign Git commits.

### Configure SSH signing in Git

Once you have your SSH key configured, you need to tell git to use your SSH key to sign commits. We do this by adding some options to the git config as follows:

```bash
git config --global gpg.format ssh
git config --global user.signingkey "$(cat ~/.ssh/id_ed25519.pub)"
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
git config --global commit.gpgsign true
```

### Signing a commit

Everything is now set up to sign commits. All you have to do now is create make changes to a git repository and commit them. Git will automatically sign the commit using your SSH key. You can check that it was signed with the following command:

```bash
git log --show-signature
```

You should see something like:

```bash
Good "git" signature for Your Email with ED25519 key SHA256:23paskiasOSftzEoOa6ap6SStsJXgdgdgQmh7aj+Os
```

on the bottom of the commit.

And you can verify that the signed commit was signed by an allowed signer with the following command:

```bash
git verify-commit <commit-hash>
```

## Bonus

If you already have an unsigned commit that you want to sign, you can use:

```bash
git commit --amend --no-edit -S
git verify-commit -v HEAD
```

This will amend the last commit and then verify that it is signed. And for signing multiple commits in a branch you can use:

```bash
git rebase --exec 'git commit --amend --no-edit -n -S' -i <BRANCH>
```
