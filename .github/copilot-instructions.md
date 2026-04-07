# General setup
I have created a structure of folders for you that I want you to follow. Backend, Frontend, Testing and Documentation should be obvious. Specifications is for you and I to keep such documents as resources we use when communicating and for prompting. Always update the README.md to reflect the current state of the project. Always create Unit tests, API-tests and E2E tests for any new functionality you add. Always update the documentation for any new functionality you add. Always follow the instructions in this file when defining interactions.

## Define interactions as separated response and request graphs

Read all defined use cases and requirements.

For each distinct user interaction, produce a Use Case Interaction Specification in YAML.

You must follow this format exactly:

use_case: "<name>"
interaction: "<name>"

request_graph:
  - function: "<name>"
    layer: "boundary | utility"
    responsibility: "<one thing>"
  - function: "<name>"
    layer: "boundary | utility"
    responsibility: "<one thing>"
  - function: "<core function name>"
    layer: "core"
    responsibility: "<use case intent>"

core:
  function: "<core function name>"
  responsibility: "<use case intent>"
  delegates:
    - "<function>"
    - "<function>"

response_graph:
  - function: "<name>"
    layer: "utility | boundary"
    responsibility: "<one thing>"
  - function: "<name>"
    layer: "utility | boundary"
    responsibility: "<one thing>"

shared_functions:
  - "<function name>"
  - "<function name>"


### Rules

- Each interaction must have exactly one core function.
- The core function is the center: it receives processed request input and returns output for the response.
- Separate request and response graphs completely.
- Each node must be a function with a single responsibility.
- Use only three layers: boundary, core, utility.
- Boundary = API/UI edge.
- Core = the use case function.
- Utility = everything else.
- Do not introduce extra architectural layers.
- Prefer small, composable functions.
- Function names must be concrete and implementation-ready.
- If a function is reused across interactions, include it in shared_functions.

### Example

```yaml

use_case: "Create game session"
interaction: "User creates a new game"

request_graph:
  - function: "postCreateGameEndpoint"
    layer: "boundary"
    responsibility: "Receive HTTP request"
  - function: "mapCreateGameRequest"
    layer: "utility"
    responsibility: "Map request to command"
  - function: "createGameSession"
    layer: "core"
    responsibility: "Create a new game session"

core:
  function: "createGameSession"
  responsibility: "Create a new game session"
  delegates:
    - "generateGameId"
    - "buildInitialBoard"
    - "saveGame"

response_graph:
  - function: "mapCreateGameResult"
    layer: "utility"
    responsibility: "Map result to response DTO"
  - function: "sendCreateGameResponse"
    layer: "boundary"
    responsibility: "Return HTTP response"

shared_functions:
  - "mapCreateGameRequest"
  - "mapCreateGameResult"

```