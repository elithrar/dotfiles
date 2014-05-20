set nocompatible  " Use Vim settings, rather then Vi settings
set nobackup
set nowritebackup
set noswapfile    " http://robots.thoughtbot.com/post/18739402579/global-gitignore#comment-458413287
set history=50
set ruler         " show the cursor position all the time
set showcmd       " display incomplete commands
set incsearch     " do incremental searching
set laststatus=2  " Always display the status line
set number

filetype on

set rtp+=~/.vim/bundle/vundle/
call vundle#rc()

" let Vundle manage Vundle
" required! 
Bundle 'gmarik/vundle'

" Bundles
Bundle 'tpope/vim-sensible'
Bundle 'tpope/vim-surround' 
Bundle 'Lokaltog/powerline'
Bundle 'kien/ctrlp.vim'
Bundle 'groenewege/vim-less'
Bundle 'flazz/vim-colorschemes'
Bundle 'chriskempson/tomorrow-theme', {'rtp': 'vim/'}
Bundle 'jnwhiteh/vim-golang'
Bundle 'scrooloose/syntastic'
Bundle 'saltstack/salt-vim'
Bundle 'nsf/gocode', {'rtp': 'vim/'}
Bundle 'scrooloose/nerdtree'

" NERDTree
map <C-t> :NERDTreeToggle<CR>

" Colorscheme
colorscheme Tomorrow-Night

" Go
set runtimepath+=$GOROOT/misc/vim

" Taken from http://dougblack.io/words/a-good-vimrc.html
set wildmenu            " visual autocomplete for command menu
set showmatch           " highlight matching [{()}]
set incsearch           " search as characters are entered
set hlsearch            " highlight matches
set ignorecase
set smartcase

set hidden
set backspace=indent,eol,start

" vim splits
set splitbelow
set splitright
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>

" PuTTY Fix
if &term =~ "xterm"
    "256 color --
    let &t_Co=256
    " restore screen after quitting
    set t_ti=ESC7ESC[rESC[?47h t_te=ESC[?47lESC8
    if has("terminfo")
        let &t_Sf="\ESC[3%p1%dm"
        let &t_Sb="\ESC[4%p1%dm"
    else
        let &t_Sf="\ESC[3%dm"
        let &t_Sb="\ESC[4%dm"
    endif
endif

" Switch syntax highlighting on, when the terminal has colors
" Also switch on highlighting the last used search pattern.
if (&t_Co > 2 || has("gui_running")) && !exists("syntax_on")
  syntax on
endif

" Autocompletion
filetype plugin indent on
set ofu=syntaxcomplete#Complete
let g:neocomplete#enable_at_startup = 1

" Softtabs, 2 spaces
set tabstop=4
set shiftwidth=4
set expandtab
set wrap

