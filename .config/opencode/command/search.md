---
description: "search the current codebase for specific functionality or behavior"
---

search the current codebase for specific functionality or behavior related to the provided arguments.

$ARGUMENTS

when searching, consider:

1. using tools like rg to search for string literals, function/method names, and classes/structs that match or closely match the search term(s)
2. constructing a diagram to understand control flow
3. understanding the dependency tree and whether the search term(s) are used in any dependencies
4. checking configuration files and scripts
5. biasing towards code that handles or is related to: user input, input validation, error handling, security/cryptography, I/O boundaries, API calls, and/or big-O complexity.

usage examples:

- /search find cases where JSON parsing errors are not caught
- /search provide a list of error messages that do not provide actionable information
- /search find instances where API calls to external services are not retried or rate-limited

the search should return:

- a list of associated code across the codebase, ranked by relevance (high/med/low)
- the path to the file 
- code snippets (focused on the users ask + minimal surrounding context)

if you don't find matches, say so.
