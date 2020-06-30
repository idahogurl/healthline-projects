const GET_PROJECT_FROM_ISSUE = `
query getProjectFromIssue($id: ID!) {
  node(id: $id) {
    id
    ... on Issue {
      number
      projectCards(first: 1) {
        nodes {
          node_id: id
          column {
            id
            name
          }
          project {
            id
            name
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
query getProjectColumns($id: ID!, $project: String!) {
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
