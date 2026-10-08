"""Create a disposable review target; no network or existing repository changes."""
import argparse
from pathlib import Path
import subprocess


def create_fixture(destination):
    destination = Path(destination).resolve()
    destination.mkdir(parents=True, exist_ok=False)

    def git(*args):
        return subprocess.check_output(
            ["git", "-C", str(destination), "-c", "core.hooksPath=/dev/null",
             "-c", "commit.gpgsign=false", *args], text=True,
            stderr=subprocess.PIPE,
        ).strip()

    git("init", "-b", "main")
    git("config", "user.name", "Skill fixture")
    git("config", "user.email", "fixture@example.invalid")
    (destination / "account.js").write_text(
        "function accountId(user) {\n"
        "  if (!user) return null;\n"
        "  return user.account.id;\n}\n"
        "module.exports = { accountId };\n"
    )
    git("add", ".")
    git("commit", "-m", "initial account helper")
    initial = git("rev-parse", "HEAD")
    (destination / "base.txt").write_text("shared base change\n")
    git("add", ".")
    git("commit", "-m", "shared base")
    base = git("rev-parse", "HEAD")
    git("switch", "-c", "feature")
    account = destination / "account.js"
    account.write_text(account.read_text().replace(
        "if (!user) return null;", "if (!user) console.warn('missing user');"
    ))
    git("add", ".")
    git("commit", "-m", "log missing user")
    git("update-ref", "refs/remotes/origin/feature", "HEAD")
    git("switch", "main")
    (destination / "main-only.txt").write_text("unrelated later base change\n")
    git("add", ".")
    git("commit", "-m", "advance remote main")
    git("update-ref", "refs/remotes/origin/main", "HEAD")
    git("switch", "feature")
    git("update-ref", "refs/heads/main", initial)
    git("config", "remote.origin.url", "https://example.invalid/fixture.git")
    git("config", "remote.origin.fetch", "+refs/heads/*:refs/remotes/origin/*")
    git("branch", "--set-upstream-to=origin/feature", "feature")
    return {"path": str(destination), "merge_base": base}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", help="new, nonexistent directory")
    args = parser.parse_args()
    print(create_fixture(args.destination)["path"])
