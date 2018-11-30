# dotfiles

✏ dotfiles & installation script for my development environment.

## Install

There are three major components: the [Boxstarter](https://boxstarter.org) script for setting up Windows + WSL, the `setup.sh` script for building a Linux/macOS dev environment, and the `.dotfiles` themselves.

_Windows_: [Install Boxstarter](https://boxstarter.org/InstallBoxstarter) and then, in a Powershell shell:

```sh
Install-BoxstarterPackage -PackageName windows-boxstarter.ps1
```

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
- Safe to run repeatedly (checks for existing installs)
- Repository at https://github.com/elithrar/dotfiles
- Fork as needed
- Deeply inspired by https://github.com/minamarkham/formation
-----
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
