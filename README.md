# dotfiles

Dotfiles & installation script for my development environment.

## Install

```sh
# Install dependencies, Homebrew, packages, and tooling
sh install.sh 2>&1 | tee ~/install.log

# Symlink dotfiles with GNU Stow (assuming cloned to $HOME/repos/dotfiles)
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

## What I Use

- [Ghostty](https://ghostty.org/)
- [zsh](https://github.com/robbyrussell/oh-my-zsh)
- [Zed](https://zed.dev/)
- [Berkeley Mono](https://usgraphics.com/products/berkeley-mono)

## License

MIT
