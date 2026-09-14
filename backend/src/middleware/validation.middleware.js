export const validate = (schema) => (request, _response, next) => {
  const result = schema.safeParse({
    body: request.body,
    params: request.params,
    query: request.query,
  });
  if (!result.success)
    return next(
      Object.assign(new Error("Validation failed"), {
        code: "VALIDATION_ERROR",
        statusCode: 400,
        details: result.error.flatten(),
      }),
    );
  request.validated = result.data;
  next();
};
