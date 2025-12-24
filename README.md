# dotfiles

✏ dotfiles & installation script for my development environment.

bonk was here

## Install

There are two major components:

1. `install.sh` - which sets up dependencies, installs Homebrew and related packages, and links in dotfiles, on macOS and Linux
2. The 'dotfiles' themselves - `.tmux.conf`, `.zshrc`, etc.

Install the dependencies: package manager, packages, tooling:

```sh
sh install.sh 2>&1 | tee ~/install.log

Running...
 _           _        _ _       _
(_)_ __  ___| |_ __ _| | |  ___| |__
| | '_ \/ __| __/ _  | | | / __| '_ \
| | | | \__ \ || (_| | | |_\__ \ | | |
|_|_| |_|___/\__\__,_|_|_(_)___/_| |_|

-----
- Sets up a Linux or macOS based development machine.
- Can be run in WSL on Windows!
- Safe to run repeatedly (checks for existing installs)
- Repository at https://github.com/elithrar/dotfiles
- Fork as needed
- Deeply inspired by https://github.com/minamarkham/formation
-----
```

Use [GNU Stow](https://www.gnu.org/software/stow/manual/stow.html) to automatically symlink the dotfiles:

```sh
# Assuming you've cloned to $HOME/repos/dotfiles
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

## What I Use

- [Ghostty](https://ghostty.org/) on macOS as my primary terminal environment - `install.sh` will install it for you.
- zsh and [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) as my shell.
- [Zed](https://zed.dev/) as my editor (previously: VS Code)
- [Berkeley Mono](https://usgraphics.com/products/berkeley-mono) (TX-02) as my font.

## License

📜 See LICENSE file for details.
