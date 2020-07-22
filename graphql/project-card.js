const GET_PROJECT_CARD_DETAILS = `
query getProjectCardDetails($id: ID!) {
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
      content: issue {
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

const GET_PROJECT_CARD_FROM_ISSUE = `
query getProjectCardFromIssue($id: ID!) {
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

const DELETE_PROJECT_CARD = `
  mutation deleteProjectCard($input: DeleteProjectCardInput!) {
    deleteProjectCard(input: $input) {
      clientMutationId   
    }
  }
`;

module.exports = {
  ADD_PROJECT_CARD,
  MOVE_PROJECT_CARD,
  DELETE_PROJECT_CARD,
  GET_PROJECT_CARD_DETAILS,
  GET_PROJECT_CARD_FROM_ISSUE,
};
