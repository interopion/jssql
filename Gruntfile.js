module.exports = function(grunt) {

	var jsFiles = [
		'src/constants.js',
		'src/utils.js',
		'src/errors.js',
		'src/events.js',
		'src/tokenizer.js',
		'src/Walker.js',
		'src/BinaryTree.js',
		'src/Transaction.js',
		'src/statements/conflict-clause.js',
		'src/statements/indexed-column.js',
		'src/statements/use.js',
		'src/statements/show_databases.js',
		'src/statements/show_tables.js',
		'src/statements/show_columns.js',
		'src/statements/create_database.js',
		'src/statements/create_table.js',
		'src/statements/drop_database.js',
		'src/statements/drop_table.js',
		'src/statements/insert.js',
		'src/statements/select.js',
		'src/statements/delete.js',
		'src/statements/update.js',
		'src/statements/begin.js',
		'src/statements/commit.js',
		'src/statements/rollback.js',
		'src/statements/source.js',
		'src/parser.js',
		'src/storage/StorageBase.js',
		'src/storage/LocalStorage.js',
		'src/storage/MemoryStorage.js',
		'src/Persistable.js',
		'src/Server.js',
		'src/Database.js',
		'src/Table.js',
		'src/Column.js',
		'src/TableRow.js',
		//'src/TableCell.js',
		'src/TableIndex.js',
		'src/query.js',
		'src/export.js',
		'src/Result.js',
		'src/facade.js',
		'src/init.js'
	];

	// Project configuration.
	grunt.initConfig({
		pkg   : grunt.file.readJSON('package.json'),
		bump: {
			options: {
				files: ['package.json'],
				updateConfigs: ['pkg'],
				commit: false,
				//commitMessage: 'Release v%VERSION%',
				//commitFiles: ['package.json'],
				createTag: false,
				//tagName: 'v%VERSION%',
				//tagMessage: 'Version %VERSION%',
				push: false,
				//pushTo: 'upstream',
				//gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
			}
		},
		concat: {
			options: {
				separator    : "\n",
				banner       : '/**\n' + 
							   ' * jsSQL version <%= pkg.version %>\n' + 
							   ' */\n' + 
							   '(function(GLOBAL,undefined){\n"use strict";\n',
				footer       : "\njsSQL.version = '<%= pkg.version %>';\n})(window);\n",
				stripBanners : false,
				process      : function(src, filepath) {
					return  '\n' + 
							'// ---------------------------------------------' +
							'--------------------------------\n' +
							'// Starts file "' + filepath + '"\n' + 
							'// ---------------------------------------------' +
							'--------------------------------\n' +
					src;
				}
			},
			dist: {
				src : jsFiles,
				dest: '<%= pkg.name %>.js',
			},
		},
		jshint: {
			options: {
				//curly: true,
				//eqeqeq: true,
				eqnull: true,
				browser: true,
				evil : true,
				globals: {
					
				}
			},
			beforeconcat: jsFiles.concat(["Gruntfile.js"]),
			afterconcat : ['<%= pkg.name %>.js']
		},
		uglify: {
			afterconcat: {
				files: {
					'<%= pkg.name %>.min.js': ['<%= pkg.name %>.js']
				}
			}
		},
		watch : {
			js : {
				files : jsFiles.concat(["Gruntfile.js"]),
				tasks : ["default"],
				options : {
					interrupt : true
				}
			}
		},
		jsdoc : {
			dist : {
				src: jsFiles.concat(["readme.md"]),
				options: {
					destination: 'doc',
				}
			},
			website : {
				src: jsFiles.concat(["readme.md"]),
				options: {
					destination: 'site/www/jsdoc',
					//template   : './node_modules/grunt-jsdoc/node_modules/jsdoc/templates/custom'
				}
			}
		}
	});

	// Load the plugins
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch' );
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-jsdoc');
	grunt.loadNpmTasks('grunt-bump');

	// Default task(s).
	grunt.registerTask('default', [
		'jshint:beforeconcat', 
		'bump',
		'concat',
		'jshint:afterconcat', 
		'uglify:afterconcat',
		'jsdoc:website'
	]);
};
