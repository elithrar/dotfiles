let mapleader="\<space>"
let maplocalleader="\<space>"

set mouse=a
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
set list                                        " Show whitespace
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
set nojoinspaces        " use single spaces when using gq

" Vundle
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()
Plugin 'gmarik/Vundle.vim'

" Plugins
Plugin 'Valloric/YouCompleteMe'
Plugin 'tpope/vim-surround'
Plugin 'tpope/vim-markdown'
Plugin 'tpope/vim-fugitive'         " git
Plugin 'tpope/vim-abolish'      " better word search (abbrev, ignore case, etc)
Plugin 'tpope/vim-vinegar'      " netrw improvements
Plugin 'justinmk/vim-sneak'     " e.g. s{char}{char} - jump to chars. sab = next.
Plugin 'ctrlpvim/ctrlp.vim'             " fuzzy search
Plugin 'scrooloose/syntastic'
Plugin 'fatih/vim-go'
Plugin 'scrooloose/nerdtree'    " file nav. tree 
Plugin 'rking/ag.vim'           " Silver Searcher plugin
Plugin 'vim-airline/vim-airline'      " status bar
Plugin 'majutsushi/tagbar'      " definitions/tag tree
Plugin 'pangloss/vim-javascript'
Plugin 'othree/html5.vim'       " HTML5 syntax
Plugin 'posva/vim-vue'          " Vue.js
Plugin 'cespare/vim-toml'
" Plugin 'wookiehangover/jshint.vim'
" Plugin 'mxw/vim-jsx'
" Plugin 'nginx.vim'

" Color schemes
" Plugin 'morhetz/gruvbox'
" Plugin 'joshdick/onedark.vim'
" Plugin 'rakr/vim-one'
Plugin 'mhartington/oceanic-next'
Plugin 'dracula/vim'

call vundle#end()

" Colorscheme
if (has("termguicolors"))
 set termguicolors
endif
syntax enable
set background=dark
let g:airline_theme='oceanicnext'
colorscheme OceanicNext

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

let g:syntastic_auto_loc_list=1

" Go
" goimports
let g:go_fmt_command = "goimports"
" Go html/template
au BufNewFile,BufRead *.tmpl set filetype=html
" Syntastic fix per https://github.com/scrooloose/syntastic/issues/1436
let g:syntastic_go_go_build_args = "-o /tmp/go-build-artifact"
let g:syntastic_go_checkers = ['govet', 'errcheck', 'go']
let g:syntastic_mode_map = { 'mode': 'active', 'passive_filetypes': ['go'] }
let g:go_list_type = "quickfix"

" GoDecls
au FileType go nmap <C-D> :GoDecls<CR>

au FileType go nmap <leader>r <Plug>(go-run)
au FileType go nmap <leader>b <Plug>(go-build)
au FileType go nmap <leader>t <Plug>(go-test)
au FileType go nmap <leader>c <Plug>(go-coverage)

au FileType go nmap <leader>ds <Plug>(go-def-split)
au FileType go nmap <leader>dv <Plug>(go-def-vertical)
au FileType go nmap <leader>dt <Plug>(go-def-tab)

au FileType go nmap <leader>gd <Plug>(go-doc-vertical)
au FileType go nmap <leader>gh <Plug>(go-doc)
au FileType go nmap <leader>gb <Plug>(go-doc-browser)
au FileType go nmap <leader>s <Plug>(go-implements)

" Python
let g:ycm_python_binary_path = "python3"
let g:syntastic_python_checkers = ['pylint']

" Markdown
autocmd BufNewFile,BufReadPost *.md set filetype=markdown
let g:markdown_fenced_languages = ['go', 'css', 'ruby', 'javascript', 'sh', 'json', 'diff', 'html', 'vim']
au FileType markdown setlocal textwidth=100

au FileType css setlocal sw=2 ts=2 expandtab " HTML
au FileType css setlocal sw=2 ts=2 expandtab " CSS
au FileType vue setlocal shiftwidth=2 tabstop=2 expandtab " Vue.js
au FileType json setlocal conceallevel=0 sw=2 ts=2 expandtab "JSON

let g:syntastic_javascript_checkers = ['eslint']
au FileType javascript setlocal shiftwidth=2 tabstop=2 expandtab " JS

autocmd BufRead,BufNewFile *.lua set shiftwidth=3 tabstop=3 " Lua
autocmd BufNewFile,BufReadPost *.t set filetype=lua ts=4 sw=4 et: " Tests

" YCM debugging
" let g:ycm_server_keep_logfiles = 1
" let g:ycm_server_log_level = 'debug'

" === Keyboard shortcuts ===
" Write as sudo
cmap w!! w !sudo tee > /dev/null %
" Reindent and restore position
map <leader>z mzgg=G`z

" Turn off search result highlighting
nnoremap <leader>h :noh<CR>

" Buffer navigation (next/back/close)
nnoremap <leader>n :bnext<CR>
nnoremap <leader>p :bprevious<CR>
nnoremap <leader>q :bdelete<CR>

" NERDTree
nnoremap <leader>` :NERDTreeToggle<CR>

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
