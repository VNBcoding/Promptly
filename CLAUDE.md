# Promptly — Project Notes for Claude

## GitHub Push & Authentication

### Lessons Learned (March 2026)

#### Use Classic PATs, Not Fine-Grained
- Fine-grained tokens (`github_pat_...`) **cannot push to repos owned by other users**, even as a collaborator.
- Always use **Tokens (classic)** (`ghp_...`) when pushing to someone else's repo.
- Classic token path: GitHub → Settings → Developer settings → Personal access tokens → **Tokens (classic)**

#### Required Scope
- When creating a classic PAT, always check the **`repo`** scope — this is what grants push (write) access.
- Without `repo` scope, GitHub authenticates you but still returns 403 on push.

#### Never Share PATs in Chat
- GitHub's secret scanning **automatically revokes tokens** that appear in chat or public text.
- Always paste tokens directly into the terminal only — never share them in a conversation.

#### Diagnosing 403 Permission Errors
- If push fails with `Permission to X denied to Y`, verify push access via:
  ```bash
  curl -H "Authorization: token YOUR_PAT" https://api.github.com/repos/OWNER/REPO | grep -A3 '"permissions"'
  ```
  If `push: true`, the issue is likely the PAT type (fine-grained vs classic) or missing `repo` scope.

#### Credential Caching (macOS)
- macOS uses `osxkeychain` to cache git credentials.
- To clear cached GitHub credentials:
  ```bash
  security delete-internet-password -s github.com
  ```
- To disable for a specific repo:
  ```bash
  git config --local credential.helper ''
  ```

#### Embedding PAT in Remote URL
- Bypass credential prompts by embedding the token directly:
  ```bash
  git remote set-url origin https://USERNAME:YOUR_PAT@github.com/OWNER/REPO.git
  ```

#### Diverged Histories
- If local and remote have different commit histories (e.g. a README was created on GitHub), use force push:
  ```bash
  git push -f -u origin main
  ```
