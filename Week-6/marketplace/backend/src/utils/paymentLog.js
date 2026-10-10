export const paymentLog = (event, fields = {}) => {
  console.log(
    JSON.stringify({
      at: new Date().toISOString(),
      scope: "payment",
      event,
      ...fields,
    }),
  );
};
