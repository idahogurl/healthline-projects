const { getAccessJwt } = require('./zube');

getAccessJwt({
  log: {
    info: (x) => {
      console.log(x);
    },
  },
}).then((response) => {
  console.log(response);
});
