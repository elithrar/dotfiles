# dotfiles

✏ dotfiles & installation script for my development environment.

## Install

Install the dependencies: package manager, packages, tooling:

```sh
sh setup.sh 2>&1 | tee ~/setup.log
```

Use [rcm](https://github.com/thoughtbot/rcm) to automatically symlink the dotfiles:

```sh
rcup -d ~/.dotfiles
```

## Notes:

- I currently use [Hyper 2](https://zeit.co/blog/hyper2) as my terminal emulator, with the [Dracula](https://github.com/dracula/hyper) theme
- zsh and [oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh) as my shell
- My `.vimrc` is commented and clear about what-applies-to-what.
- I use the [Fira Mono](http://mozilla.github.io/Fira/) typeface.

## License

📜 See LICENSE file for details.
