const GET_PROJECT_CARD_ISSUE = `
query getProjectCard($id: ID!) {
  node(id: $id) {
    node_id: id
    ... on ProjectCard {
      column {
        id
        name
        project {
          id
          name
        }
      }
      content {
        ... on Issue {
          id
          title
          number
          labels(first: 10) {
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

const MOVE_PROJECT_CARD = `
mutation moveProjectCard($input: MoveProjectCardInput!) {
  moveProjectCard(input: $input) {
    clientMutationId
  }
}
`;

const ADD_PROJECT_CARD = `
mutation addProjectCard($input: AddProjectCardInput!) {
  addProjectCard(input: $input) {
    clientMutationId   
  }
}
`;

module.exports = {
  ADD_PROJECT_CARD,
  MOVE_PROJECT_CARD,
  GET_PROJECT_CARD_ISSUE,
};
