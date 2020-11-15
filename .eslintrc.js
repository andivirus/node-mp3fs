module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    parserOptions: {
        project: './tsconfig.json'
    },
    rules: {
        "arrow-spacing": ["error", {
            "before": true,
            "after": true
        }],

    }
};
