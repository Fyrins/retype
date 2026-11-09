import { defineConfig } from 'vitest/config';

// The front-end script runs against a DOM, so every test file gets jsdom.
// Globals stay off: each file imports what it uses from vitest.
export default defineConfig( {
	test: {
		environment: 'jsdom',
		globals: false,
		restoreMocks: true,
		include: [ 'src/**/*.test.js' ],
	},
} );
