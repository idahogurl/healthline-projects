
# healthline-projects

> A GitHub App that synchronizes GitHub project cards with Zube.io kanban board.

## USE CASE

When user assigns issue to project board in GitHub

### Handler Logic

1. Find the issue of card
2. Does that issue already have a Zube label?
	- **Yes** - Move card to column matching Zube label
	- **No** 
	  - Query zube for card
      - Query for categories in Zube
	  - Move card to matching category in Zube

## USE CASE

When a user clicks `Add to Source`, Zube will create GitHub issue and then add Zube label to related GitHub issue.

### Handler Logic

1. Check if Zube label
2. Query for issue's project cards
3. Does it have an project card?
	- **Yes** - Create project card
	- **No** - Does it already have a Zube label and not the same Zube label?
		 - **Yes** - Move to GitHub project column matching Zube label
		 - **No** - Do nothing

  
## USE CASE

When a user moves card in Zube, Zube then labels related GitHub issue. The label starts with the prefix of `[zube]: ` followed by the  Zube column name.

### Handler Logic
1. Is the label a Zube label?
	- Find project card from issue that was labeled
	- Is project card already in column whose name match Zube label?
      - **Yes** - Do nothing
      - **No** - Move card to column
2. Is the label a priority label? 
 	- Find project card from issue that was labeled
 	- Set Zube card to priority matching the label

## USE CASE

When a user moves card in GitHub

### Handler Logic

1. Remove existing Zube label (if any)
2. Add Zube label matching GitHub project column name

## License

[ISC](LICENSE) © 2020 Rebecca Vest <rvest@healthline.com>
