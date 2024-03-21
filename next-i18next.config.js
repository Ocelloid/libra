const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ru"],
  },
  localesDir: path.resolve("./public/locales"),
};
