const GET_PROJECT_CARD = `
query getCardInfo($id: ID!) {
  node(id: $id) {
    id
    ... on ProjectCard {
      column {
        id
        name
      }
      content {
        ... on Issue {
          id
          title
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
  GET_PROJECT_CARD,
};
