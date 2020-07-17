/* eslint-env jest, node */
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
  };
}

module.exports = {
  spyOnObject,
  mockContext,
};
