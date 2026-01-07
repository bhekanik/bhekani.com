---
title: "How to sign Git commits with SSH keys"
pubDate: 2024-02-10
published: true
description: "Git version 2.34.0+ supports SSH for signing commits for a simpler, smoother process. In this article, I've put together a quick and easy guide on how to use SSH to sign your Git commits—easy setup, secure commits, no fuss."
author: "Bhekani Khumalo"
tags: ["technical", "til"]
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

## Add your public key to Github

You now need to add your signing key to Github so that it will have it in its "known signers" file for verification.

Head over to User Profile > Settings > SSH and GPG keys. Click the "New SSH key" button. Give your new key a title, then under Key type select Signing Key. Then run:

```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

This will copy your publish ssh key into your clipboard. Paste it into the Key section. Click Add SSH Key and you should be ready to go.

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

## Updates

### error: Couldn't find key in agent?

If you encounter the error, "error: Couldn't find key in agent? fatal: failed to write commit object," it typically indicates that Git cannot access your SSH key through the SSH agent. This might be because the SSH agent is not running or because your SSH key has not been added to the agent. To resolve this issue and avoid having to manually start the SSH agent and add your key every time, you can automate these steps. Here's how you can do it for different operating systems:

#### For Linux and macOS

1. Automatically Start SSH Agent and Add SSH Key on Session Start:

- You can add commands to your shell's startup file (e.g., .bashrc, .bash_profile, .zshrc, etc.) to automatically start the SSH agent and add your SSH key when you open a terminal.

2. Edit Your Shell's Startup File:

- Open your terminal and edit your shell's startup file, for example, if you're using bash, you edit ~/.bashrc or ~/.bash_profile. If you're using zsh, you edit ~/.zshrc.

3. Add the Following Script:

```bash
# Start the SSH agent and add your key
if [ -z "$SSH_AUTH_SOCK" ] ; then
  eval `ssh-agent -s`
  ssh-add ~/.ssh/id_ed25519
fi
```

- This script checks if the SSH agent is running (by checking if $SSH_AUTH_SOCK is set). If it's not running, it starts the SSH agent and adds your SSH key.

4. Reload Your Shell Configuration:

- Apply the changes by running source ~/.bashrc (or the appropriate file for your shell).

#### For Windows

1. Using SSH-Agent Service:

- On Windows, you can use the SSH-Agent service, which is available in Windows 10 and later. This service can be set to start automatically.

2. Enable and Start SSH-Agent Automatically:

- Open a PowerShell window as Administrator.
- Run the following commands to set the SSH Agent service to start automatically and then start it:

```powershell
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

- After enabling the service, you need to add your SSH key to the agent once using:

```powershell
ssh-add ~\.ssh\id_rsa
```

By setting up your system as described, your SSH agent will automatically start and load your SSH key when you start a new session, which should prevent the error from occurring when you commit changes using Git.
