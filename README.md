# healthline-projects

> A GitHub App that synchronizes GitHub project cards with Zube.io kanban board.

When a user clicks 'Add to Source' Zube :
1. Creates GitHub issue
2. Adds Zube label to GitHub issue

on issue.labeled
1. Query for issue's project cards
2. If no project card then create one

ELSE 

  1. Does it already have a Zube label?
  2. Does it already have the same Zube label
    Do nothing
        ELSE
    Remove current label and add new label

on project_card.created


on project_card.moved

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## License

[ISC](LICENSE) © 2020 Rebecca Vest <rvest@healthline.com>
