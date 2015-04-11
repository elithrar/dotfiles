filetype off 
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
set clipboard=unnamed " Use system clipboard

" Vundle
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'gmarik/Vundle.vim'

" Plugins
Plugin 'tpope/vim-sensible'
Plugin 'tpope/vim-surround'
Plugin 'nsf/gocode', {'rtp': 'vim/'}
Plugin 'tpope/vim-markdown'
Plugin 'Lokaltog/powerline'
Plugin 'kien/ctrlp.vim'
Plugin 'groenewege/vim-less'
Plugin 'flazz/vim-colorschemes'
Plugin 'chriskempson/tomorrow-theme', {'rtp': 'vim/'}
Plugin 'scrooloose/syntastic'
Plugin 'guns/vim-clojure-static'
Plugin 'chase/vim-ansible-yaml'
Plugin 'saltstack/salt-vim'
Plugin 'fatih/vim-go'
Plugin 'scrooloose/nerdtree' 
Plugin 'valloric/MatchTagAlways'
Plugin 'nginx.vim'
Plugin 'wting/rust.vim'
Plugin 'ryanss/vim-hackernews'

call vundle#end()
filetype plugin indent on

" Write as sudo
cmap w!! w !sudo tee > /dev/null %

" NERDTree
map <C-t> :NERDTreeToggle<CR>

" Colorscheme
colorscheme Tomorrow-Night

" Go
if exists("g:did_load_filetypes")
  filetype off
  filetype plugin indent off
endif
filetype plugin indent on
syntax on
" goimports
"let g:gofmt_command ="goimports"
" gofmt on save
"autocmd FileType go autocmd BufWritePre <buffer> Fmt
" Go html/template
au BufNewFile,BufRead *.tmpl set filetype=html

" Markdown
autocmd BufNewFile,BufReadPost *.md set filetype=markdown
let g:markdown_fenced_languages = ['go', 'css', 'ruby']

" CtrlP
let g:ctrlp_map = '<c-p>'
let g:ctrlp_cmd = 'CtrlP'
let g:ctrlp_working_path_mode = 'c'
set wildignore+=*/tmp/*,*.so,*.swp,*.zip     " Linux/MacOSX

" Taken from http://dougblack.io/words/a-good-vimrc.html
set wildmenu            " visual autocomplete for command menu
set showmatch           " highlight matching [{()}]
set incsearch           " search as characters are entered
set hlsearch            " highlight matches
set ignorecase
set smartcase

" Softtabs, 2 spaces
set tabstop=4
set shiftwidth=4
set expandtab
set wrap
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
"if (&t_Co > 2 || has("gui_running")) && !exists("syntax_on")
"  syntax on
"endif

" Autocompletion
filetype plugin indent on
set ofu=syntaxcomplete#Complete
let g:neocomplete#enable_at_startup = 1

