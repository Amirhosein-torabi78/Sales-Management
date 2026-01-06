/** @format */

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSearchQuery = ({ body, stringFields = [], exactFields = [] }) => {
  const query = {};

  for (const key in body) {
    const value = body[key];

    if (stringFields.includes(key) && typeof value === "string") {
      query[key] = {
        $regex: escapeRegex(value),
        $options: "i",
      };
      continue;
    }

    if (exactFields.includes(key)) {
      query[key] = value;
    }
  }

  return query;
};

module.exports = buildSearchQuery;
