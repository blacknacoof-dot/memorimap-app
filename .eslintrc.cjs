module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs', 'scripts/', 'node_modules/'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        // CLAUDE.md 규칙 4: any 타입 사용 금지
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
        }],
        '@typescript-eslint/ban-ts-comment': 'warn',
        // CLAUDE.md: 프로덕션 console.log 금지
        'no-console': ['warn', { allow: ['error', 'warn'] }],
        // CLAUDE.md 규칙 9: 사용자 입력 URL 검증
        'no-script-url': 'error',
    },
    overrides: [
        {
            // 스크립트/테스트 파일은 console.log 허용
            files: ['scripts/**/*', '**/*.test.*', '**/*.spec.*', 'cypress/**/*', 'tests/**/*'],
            rules: {
                'no-console': 'off',
                '@typescript-eslint/no-explicit-any': 'off',
            },
        },
        {
            // 로거/레거시 파일 예외
            files: ['lib/logger.ts', 'utils/logger.ts'],
            rules: {
                'no-console': 'off',
            },
        },
        {
            // 레거시 파일 @ts-ignore 허용
            files: ['**/*.legacy.*'],
            rules: {
                '@typescript-eslint/ban-ts-comment': 'off',
            },
        },
    ],
}
