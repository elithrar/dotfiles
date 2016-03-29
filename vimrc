let mapleader="\<space>"
let maplocalleader="\<space>"

filetype off
set nobackup
set nowritebackup
set noswapfile     
set autoread
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
set textwidth=80
set colorcolumn=+1
set formatoptions+=t

" Vundle
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'gmarik/Vundle.vim'

" Plugins
Plugin 'Valloric/YouCompleteMe'
" Plugin 'Shougo/deoplete.nvim'
" Plugin 'zchee/deoplete-go', {'build': {'unix': 'make'}}
Plugin 'tpope/vim-sensible'
Plugin 'tpope/vim-surround'
" Plugin 'nsf/gocode', {'rtp': 'nvim/'}
Plugin 'tpope/vim-markdown'
" Plugin 'Lokaltog/powerline'         
Plugin 'ctrlpvim/ctrlp.vim'             " fuzzy search
Plugin 'tpope/vim-fugitive'         " git
Plugin 'morhetz/gruvbox'            " color scheme
Plugin 'chriskempson/tomorrow-theme', {'rtp': 'nvim/'}
Plugin 'scrooloose/syntastic'
Plugin 'fatih/vim-go'
Plugin 'tpope/vim-abolish'      " better word search (abbrev, ignore case, etc)
Plugin 'scrooloose/nerdtree'    " file nav. tree 
Plugin 'rking/ag.vim'           " Silver Searcher plugin
Plugin 'vim-airline/vim-airline'      " status bar
Plugin 'tpope/vim-vinegar'      " netrw improvements
Plugin 'majutsushi/tagbar'      " definitions/tag tree 
Plugin 'cespare/vim-toml' 
Plugin 'pangloss/vim-javascript'
Plugin 'wookiehangover/jshint.vim'
Plugin 'mxw/vim-jsx'
Plugin 'nginx.vim'

call vundle#end()
filetype plugin indent on

" Colorscheme
let $NVIM_TUI_ENABLE_TRUE_COLOR=1
syntax on
set background=dark
colorscheme gruvbox
let g:gruvbox_contrast_dark = 'hard'

" Column highlighting at textwidth
highlight ColorColumn ctermbg=240
" let &colorcolumn="80,".join(range(120,255),",") " Render a line at 80 cols

" Airline
let g:airline#extensions#whitespace#checks=[]
let g:airline#extensions#tagbar#enabled = 1
let g:airline#extensions#tabline#enabled = 1
let g:airline#extensions#tabline#buffer_nr_show = 1
" let g:airline_powerline_fonts = 1

" vim-fugitive (Git)
set diffopt+=vertical

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



" For conceal markers.
if has('conceal')
  set conceallevel=2 concealcursor=niv
endif

" Go
" goimports
let g:go_fmt_command = "goimports"
" Go html/template
au BufNewFile,BufRead *.tmpl set filetype=html
" Syntastic fix per https://github.com/scrooloose/syntastic/issues/1436
let g:syntastic_go_go_build_args = "-o /tmp/go-build-artifact"
" GoDecls
au FileType go nmap <C-D> :GoDecls<CR>

au FileType go nmap <leader>r <Plug>(go-run)
au FileType go nmap <leader>b <Plug>(go-build)
au FileType go nmap <leader>t <Plug>(go-test)
au FileType go nmap <leader>c <Plug>(go-coverage)

au FileType go nmap <Leader>ds <Plug>(go-def-split)
au FileType go nmap <Leader>dv <Plug>(go-def-vertical)
au FileType go nmap <Leader>dt <Plug>(go-def-tab)

au FileType go nmap <Leader>gd <Plug>(go-doc-vertical)
au FileType go nmap <Leader>gh <Plug>(go-doc)
au FileType go nmap <Leader>gb <Plug>(go-doc-browser)
au FileType go nmap <Leader>s <Plug>(go-implements)

" Markdown
autocmd BufNewFile,BufReadPost *.md set filetype=markdown
let g:markdown_fenced_languages = ['go', 'css', 'ruby', 'javascript', 'sh', 'json', 'diff', 'html', 'vim']
au FileType markdown setlocal textwidth=100

" JSON
autocmd BufNewFile,BufRead *.json set conceallevel=0 

" ESLint (JavaScript)
let g:syntastic_javascript_checkers = ['eslint']

" Lua
autocmd BufRead,BufNewFile *.lua set shiftwidth=3 tabstop=3
autocmd BufNewFile,BufReadPost *.t set filetype=lua ts=4 sw=4 et:

" YCM debugging
" let g:ycm_server_keep_logfiles = 1
" let g:ycm_server_log_level = 'debug'

" === Keyboard shortcuts ===
" Write as sudo
cmap w!! w !sudo tee > /dev/null %

" Turn off search result highlighting
nnoremap <leader>h :noh<CR>

" Buffer navigation (next/back/close)
nnoremap <leader>n :bnext<CR>
nnoremap <leader>b :bprevious<CR>
nnoremap <leader>q :bdelete<CR>

" NERDTree
map <C-t> :NERDTreeToggle<CR>

" Tagbar
map <F2> :TagbarToggle<CR>

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
