const GET_PROJECT_FROM_ISSUE = `
query getProjectFromIssue($id: ID!) {
  node(id: $id) {
    id
    ... on Issue {
      projectCards(first: 1) {
        nodes {
          id
          number
          column {
            id
            name
          }
          project {
            columns(first: 20) {
              nodes {
                id
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

const GET_PROJECT_COLUMNS = `
query getLabel($id: ID!, $project: String!) {
  node(id: $id) {
    id
    ... on Repository {
      projects(search: $project, first: 1) {
        nodes {
          columns(first: 20) {
            nodes {
              id
              name
            }
          }
        }
      }
    }
  }
}
`;

module.exports = {
  GET_PROJECT_FROM_ISSUE,
  GET_PROJECT_COLUMNS,
};
