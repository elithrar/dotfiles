# dotfiles

✏ dotfiles & installation script for my development environment.

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

## Troubleshooting

### Common Issues

#### Stow Conflicts

**Problem:** When running `stow`, you see errors like:
```
WARNING! stowing . would cause conflicts:
  * existing target is neither a link nor a directory: .zshrc
```

**Solution:** This happens when existing files conflict with the symlinks stow wants to create. Back up and remove the conflicting files:
```sh
# Back up existing files
mv ~/.zshrc ~/.zshrc.backup
mv ~/.tmux.conf ~/.tmux.conf.backup

# Then run stow again
stow --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

Alternatively, use the `--adopt` flag to move existing files into the dotfiles directory:
```sh
stow --adopt --dir="${HOME}/repos/dotfiles" --target="${HOME}" .
```

#### Permission Errors

**Problem:** Installation fails with permission denied errors.

**Solution:** 
1. Ensure you own your home directory:
   ```sh
   sudo chown -R $(whoami) ~
   ```

2. If Homebrew has permission issues on macOS:
   ```sh
   sudo chown -R $(whoami) /usr/local/bin /usr/local/lib /usr/local/share
   ```

3. On Linux, ensure your user is in the appropriate groups:
   ```sh
   sudo usermod -aG sudo $(whoami)
   ```

#### Missing Dependencies

**Problem:** Commands not found after installation, or install script fails.

**Solution:**
1. Ensure `curl` and `git` are installed first:
   ```sh
   # Debian/Ubuntu
   sudo apt-get update && sudo apt-get install -y curl git
   
   # macOS (Xcode CLI tools)
   xcode-select --install
   ```

2. Restart your shell after installation:
   ```sh
   exec $SHELL -l
   ```

3. Verify Homebrew is in your PATH:
   ```sh
   eval "$(/opt/homebrew/bin/brew shellenv)"  # macOS Apple Silicon
   eval "$(/usr/local/bin/brew shellenv)"     # macOS Intel
   eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"  # Linux
   ```

### Getting Help

If you encounter issues not covered above:

1. **Check the install log:** Review `~/install.log` for detailed error messages
2. **Open an issue:** [Create a new issue](https://github.com/elithrar/dotfiles/issues/new) with:
   - Your operating system and version
   - The full error message
   - Steps to reproduce the problem
3. **Search existing issues:** [Browse issues](https://github.com/elithrar/dotfiles/issues) to see if your problem has been addressed

## License

📜 See LICENSE file for details.
