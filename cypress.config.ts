import { defineConfig } from 'cypress';

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
            ADMIN_PASSWORD: 'testpassword123',
            SUPER_ADMIN_EMAIL: 'superadmin@test.com',
            SUPER_ADMIN_PASSWORD: 'superadmin123',
        },

        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
});
