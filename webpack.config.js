const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

// No block.json, so the two entries are declared here: the editor script that
// registers the format, and the front-end script that animates it. Everything
// else is the @wordpress/scripts default configuration.
module.exports = (
	Array.isArray( defaultConfig ) ? defaultConfig : [ defaultConfig ]
).map( ( config ) => ( {
	...config,
	entry: {
		editor: path.resolve( __dirname, 'src/editor/index.js' ),
		view: path.resolve( __dirname, 'src/front/view.js' ),
	},
} ) );
