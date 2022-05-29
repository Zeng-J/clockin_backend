Promise.reject(67)
  .catch((e) => {
    console.log(123, e);
    return 324
  })
  .then((e) => {
    console.log(456, e);
  });
