# dotfiles

✏ dotfiles & installation script for my development environment.

## Install

There are three major components: 

1. `install.sh` - which sets up dependencies, installs Homebrew and related packages, and links in dotfiles, on macOS and Linux
2. The [Boxstarter](https://boxstarter.org) script for setting up Windows + WSL (optional!)
3. The 'dotfiles' themselves - `.tmuxconf`, `.zshrc`, etc.

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
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}"
```

## Notes:

- I use [iTerm2](https://www.iterm2.com/) on macOS as my primary terminal environment - `install.sh` will install iTerm2 for you.
- zsh and [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) as my shell
- [Visual Studio Code](https://code.visualstudio.com/) as my editor, although I still carry a `.vimrc` around.
- I use the [Fira Mono](http://mozilla.github.io/Fira/) typeface.

## License

📜 See LICENSE file for details.
