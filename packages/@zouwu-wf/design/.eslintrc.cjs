/* eslint-env node */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true,
    },
    extends: ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    plugins: ["@typescript-eslint", "react", "react-hooks"],
    settings: {
        react: {
            version: "detect",
        },
    },
    rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
};
