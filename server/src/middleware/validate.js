const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === 'body') {
        req.body = parsed;
      } else {
        req.validatedQuery = parsed;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateUuidParam = (paramName = 'id') => {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!value || !UUID_REGEX.test(String(value).trim())) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} identifier format.`
      });
    }
    next();
  };
};
