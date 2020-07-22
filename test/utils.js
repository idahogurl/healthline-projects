/* eslint-env jest, node */
const { default: fetch } = require('../__mocks__/node-fetch');

function spyOnObject(fileName, module) {
  const actual = jest.requireActual(fileName);

  const functions = Object.keys(module);
  functions.forEach((f) => {
    // don't put async unless function is async
    const isAsync = actual[f].constructor.name === 'AsyncFunction';
    if (isAsync) {
      module[f].mockImplementation(async (...args) => actual[f].apply(null, args));
    } else {
      module[f].mockImplementation((...args) => actual[f].apply(null, args));
    }
  });
}

function mockContext(content) {
  return {
    ...content,
    log: {
      info: (x) => {
        console.log(x);
      },
      warn: (x) => {
        console.warn(x);
      },
    },
    github: {
      graphql: jest.fn(async (query, variables) => {
        const response = await fetch(
          {},
          {
            body: JSON.stringify({ query, variables }),
          },
        );
        const body = response.body.toString('utf8');
        const { data } = JSON.parse(body);
        return data;
      }),
    },
  };
}

module.exports = {
  spyOnObject,
  mockContext,
};
