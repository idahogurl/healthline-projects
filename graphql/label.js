const GET_ISSUE_LABELS = `
query getIssueLabels($id: ID!) {
  node(id: $id) {
    id
    ... on Issue {
      labels(first: 20) {
        nodes {
          id
          name
        }
      }
    }
  }
}
`;

const GET_LABEL = `
query getLabel($name: String!, $owner: String!, $search: String!) {
repository(name: $name, owner: $owner) {
    labels(query: $search, first: 1) {
      nodes {
        id
        name
      }
    }
  }
}
`;

const REMOVE_LABEL = `
mutation removeLabel($labelableId: ID!, $labelIds: [ID!]!) {
  removeLabelsFromLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
      clientMutationId
  }
}
`;

const ADD_LABEL = `
mutation addLabel($labelableId: ID!, $labelIds: [ID!]!) {
  addLabelsToLabelable(input: { labelableId: $labelableId, labelIds: $labelIds }) {
    clientMutationId
  }
}
`;

module.exports = {
  GET_LABEL,
  ADD_LABEL,
  REMOVE_LABEL,
  GET_ISSUE_LABELS,
};
