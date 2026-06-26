module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*', 'supabase/functions/**'],
  rules: {
    'import/no-unresolved': 'off',
  },
};
