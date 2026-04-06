import { defineConfig } from 'cypress';

if (!process.env.CYPRESS_ADMIN_PASSWORD) {
    throw new Error('Missing CYPRESS_ADMIN_PASSWORD');
}

if (!process.env.CYPRESS_SUPER_ADMIN_PASSWORD) {
    throw new Error('Missing CYPRESS_SUPER_ADMIN_PASSWORD');
}

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: false,
        screenshotOnRunFailure: true,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,

        // Environment variables (can be overridden via cypress.env.json)
        env: {
            ADMIN_EMAIL: 'admin@test.com',
            ADMIN_PASSWORD: process.env.CYPRESS_ADMIN_PASSWORD,
            SUPER_ADMIN_EMAIL: 'superadmin@test.com',
            SUPER_ADMIN_PASSWORD: process.env.CYPRESS_SUPER_ADMIN_PASSWORD,
        },

        setupNodeEvents(_on, _config) {
            // implement node event listeners here
        },
    },
});
