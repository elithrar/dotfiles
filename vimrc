filetype off 
set nocompatible  " Use Vim settings, rather then Vi settings

set nobackup
set nowritebackup
set noswapfile     
set autoread
set encoding=utf-8 fileencoding=utf-8 termencoding=utf-8  
set history=50
set ruler                                       " Show the cursor position all the time
set showcmd                                     " Display incomplete commands
set hlsearch incsearch ignorecase smartcase     " Search
set nofoldenable                                " No code folding
set laststatus=2                                " Always display the status line
set cursorline                                  " Show current line
set noshowmode                                  " Don't show the mode
set number                                      " Show absolute line number
set clipboard=unnamed                           " Use system clipboard

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
set textwidth=81
set formatoptions+=t

" Colorscheme
colorscheme Tomorrow-Night

" Column highlighting
highlight ColorColumn ctermbg=240
let &colorcolumn="80,".join(range(120,255),",") " Render a line at 80 cols

" Vundle
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'gmarik/Vundle.vim'

" Plugins
Plugin 'Shougo/neocomplete.vim'
Plugin 'Shougo/neosnippet'
Plugin 'Shougo/neosnippet-snippets'
Plugin 'tpope/vim-sensible'
Plugin 'tpope/vim-surround'
Plugin 'nsf/gocode', {'rtp': 'vim/'}
Plugin 'tpope/vim-markdown'
Plugin 'Lokaltog/powerline'
Plugin 'kien/ctrlp.vim'
Plugin 'tpope/vim-fugitive'
Plugin 'flazz/vim-colorschemes'
Plugin 'chriskempson/tomorrow-theme', {'rtp': 'vim/'}
Plugin 'scrooloose/syntastic'
Plugin 'fatih/vim-go'
Plugin 'tpope/vim-abolish'
Plugin 'scrooloose/nerdtree' 
Plugin 'bling/vim-airline'
Plugin 'majutsushi/tagbar'
Plugin 'pangloss/vim-javascript'
Plugin 'wookiehangover/jshint.vim'
Plugin 'mxw/vim-jsx'
Plugin 'nginx.vim'

call vundle#end()
filetype plugin indent on

" Write as sudo
cmap w!! w !sudo tee > /dev/null %

" NERDTree
map <C-t> :NERDTreeToggle<CR>

" Airline
let g:airline#extensions#whitespace#checks=[]
let g:airline#extensions#tagbar#enabled = 1

" Tagbar
map <F2> :TagbarToggle<CR>

let g:tagbar_type_go = {
    \ 'ctagstype' : 'go',
    \ 'kinds'     : [
        \ 'p:package',
        \ 'i:imports:1',
        \ 'c:constants',
        \ 'v:variables',
        \ 't:types',
        \ 'n:interfaces',
        \ 'w:fields',
        \ 'e:embedded',
        \ 'm:methods',
        \ 'r:constructor',
        \ 'f:functions'
    \ ],
    \ 'sro' : '.',
    \ 'kind2scope' : {
        \ 't' : 'ctype',
        \ 'n' : 'ntype'
    \ },
    \ 'scope2kind' : {
        \ 'ctype' : 't',
        \ 'ntype' : 'n'
    \ },
    \ 'ctagsbin'  : 'gotags',
    \ 'ctagsargs' : '-sort -silent'
\ }

" Snippets
imap <C-k>  <Plug>(neosnippet_expand_or_jump)
smap <C-k>  <Plug>(neosnippet_expand_or_jump)
xmap <C-k>  <Plug>(neosnippet_expand_target)

" SuperTab like snippets behavior.
imap <expr><TAB> neosnippet#expandable_or_jumpable() ?
\ "\<Plug>(neosnippet_expand_or_jump)"
\: pumvisible() ? "\<C-n>" : "\<TAB>"
smap <expr><TAB> neosnippet#expandable_or_jumpable() ?
\ "\<Plug>(neosnippet_expand_or_jump)"
\: "\<TAB>"

" For conceal markers.
if has('conceal')
  set conceallevel=2 concealcursor=niv
endif

" Go
if exists("g:did_load_filetypes")
  filetype off
  filetype plugin indent off
endif
filetype plugin indent on
syntax on
" goimports
let g:go_fmt_command = "goimports"
" snippet plugin
let g:go_snippet_engine = "neosnippet"
" Go html/template
au BufNewFile,BufRead *.tmpl set filetype=html
" Syntastic fix per https://github.com/scrooloose/syntastic/issues/1436
let g:syntastic_go_go_build_args = "-o /tmp/go-build-artifact"

" Markdown
autocmd BufNewFile,BufReadPost *.md set filetype=markdown
let g:markdown_fenced_languages = ['go', 'css', 'ruby']

" ESLint (JavaScript)
let g:syntastic_javascript_checkers = ['eslint']

" CtrlP
let g:ctrlp_map = '<c-p>'
let g:ctrlp_cmd = 'CtrlP'
let g:ctrlp_working_path_mode = 'c'
set wildignore+=*/tmp/*,*.so,*.swp,*.zip     " Linux/MacOSX

" vim splits
set splitbelow
set splitright
nnoremap <C-J> <C-W><C-J>
nnoremap <C-K> <C-W><C-K>
nnoremap <C-L> <C-W><C-L>
nnoremap <C-H> <C-W><C-H>

" Switch syntax highlighting on, when the terminal has colors
" Also switch on highlighting the last used search pattern.
"if (&t_Co > 2 || has("gui_running")) && !exists("syntax_on")
"  syntax on
"endif

" Autocompletion
filetype plugin indent on
set ofu=syntaxcomplete#Complete
let g:neocomplete#enable_at_startup = 1

