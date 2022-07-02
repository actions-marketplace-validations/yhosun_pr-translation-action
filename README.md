# PR Translation Action

This action translates a PR (Pull Request) title, a description, and comments between two languages with Google Translate.
For example, you can assign `en` to the action inputs `language-1` and `ko` to `language-2`.
A translated Korean comment is added to an English comment, and vice versa.

## Supported Events and Types
| Event         | Types       |
| -----------   | ----------- |
| pull_request  | opened      |
| issue_comment | created     |
| pull_request_review_comment| created |

**"edited" types are not supported.**

## Action Example
```yml
name: PR Translation
on:
  pull_request:
    types: [ opened ]
  issue_comment:
    types: [created ]
jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - name: Translate
        uses: yhosun/pr-translation-action@v1.0.0
        with:
          language-1: 'en'
          language-2: 'ko'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          google-project-id: 'your-google-project-id'
          google-credentials: ${{ secrets.GOOGLE_CREDENTIALS }}
```

## google-credentials input
To use Google Translate API, Google credentials in JSON string format must pass to the `google-credentials` input.

## Development
It is based on node 16.  Please, check the `.nvmrc` file.

### Install NCC
```shell
npm i -g @vercel/ncc
```

### Build a distribution version
`npm run dev` (ncc build index.js -o dist -w)

or

`npm run build` (ncc build index.js -o dist)
