# healthline-projects

> A GitHub App built with [Probot](https://github.com/probot/probot) that Synchronizes project cards assigned to multiple project boards

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Contributing

If you have suggestions for how healthline-projects could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2020 Rebecca Vest <rvest@healthline.com>

## EXAMPLE RESPONSE
```{
  "data": {
    "node": {
      "id": "...",
      "column": {
        "id": "...",
        "name": "To do"
      },
      "content": {
        "projectCards": {
          "nodes": [
            {
              "id": "...=",
              "column": {
                "id": "...",
                "name": "To do"
              },
              "project": {
                "id": "...",
                "columns": {
                  "nodes": [
                    {
                      "id": "...",
                      "name": "To do"
                    },
                    {
                      "id": "...",
                      "name": "In progress"
                    },
                    {
                      "id": "...",
                      "name": "Review in progress"
                    },
                    {
                      "id": "...",
                      "name": "Reviewer approved"
                    },
                    {
                      "id": "...",
                      "name": "Done"
                    }
                  ]
                }
              }
            },
            {
              "id": "...",
              "column": {
                "id": "...",
                "name": "To do"
              },
              "project": {
                "id": "...",
                "columns": {
                  "nodes": [
                    {
                      "id": "...",
                      "name": "To do"
                    },
                    {
                      "id": "...",
                      "name": "In progress"
                    },
                    {
                      "id": "...",
                      "name": "Review in progress"
                    },
                    {
                      "id": "...",
                      "name": "Reviewer approved"
                    },
                    {
                      "id": "...",
                      "name": "Done"
                    }
                  ]
                }
              }
            },
            {
              "id": "...",
              "column": null,
              "project": {
                "id": "...",
                "columns": {
                  "nodes": []
                }
              }
            }
          ]
        }
      }
    }
  }
}```
