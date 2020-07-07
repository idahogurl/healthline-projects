const { getAccessJwt } = require('./zube');

getAccessJwt().then((response) => {
  console.log(response);
});
