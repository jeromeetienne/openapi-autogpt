#!/usr/bin/env node

// .env file support - MUST be first in all .exe - https://www.npmjs.com/package/dotenv
import 'dotenv/config'	

// npm imports
import * as Commander from "commander"

// local imports
import cliCommandQuery from "../src/cli_commands/cli_command_query.js"
import cliCommandGenerateAutoGptJson from "../src/cli_commands/cli_command_generate_autogpt_json.TO_REMOVE.js"
import cliCommandGenerateBotProfileJson from "../src/cli_commands/cli_command_generate_bot_profile_json.TO_REMOVE.js"
import cliCommandUpdateBotProfileJson from "../src/cli_commands/cli_command_update_bot_profile_json.TO_REMOVE.js"

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// make sure console.assert produce an exception in node.js
// - this is not the default on node.js... on node.js it just display a message
// - for more info, see https://nodejs.org/dist/latest-v14.x/docs/api/console.html#console_console_assert_value_message
import Assert from 'assert'
console.assert = function (condition, message) { Assert.ok(condition, message) }

// set default dns lookup order to ipv4 first - https://nodejs.org/api/dns.html#dnssetdefaultresultorderorder
import Dns from 'dns'
Dns.setDefaultResultOrder('ipv4first')

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	main async function
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	/////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////
	//	Parse command line
	/////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////

	// parse command line
	const cmdline = new Commander.Command()

	cmdline.name('openapi-autogpt')
		.version('0.0.3')
		.description('openapi-autogpt - text chat bot able to talk to any openapi server');

	cmdline.command('query')
		.description('query a bot')
		.requiredOption('-o, --openapi <openapiPath>', 'the path for the openapi.json file')
		.requiredOption('-a, --autogpt <autogptPath>', 'the path for the autogpt.json file')
		.action(async (options) => {
			await cliCommandQuery(options.openapi, options.autogpt)
		})

	cmdline.command('generate_autogpt_json')
		.description('generate a .openapi_autogpt.json file in stdout - useful when your original .openapi_autogpt.json is a .js file')
		.requiredOption('-a, --autogpt <autogptPath>', 'the path for the autogpt.json file')
		.action(async (options) => {
			await cliCommandGenerateAutoGptJson(options.autogpt)
		})

	cmdline.command('generate_bot_profile_json')
		.description('generate a .bot_profile.json file in stdout')
		.requiredOption('-o, --openapiUrl <openapiUrl>', 'the url for the openapi.json file')
		.requiredOption('-a, --autogpt <autogptPath>', 'the path for the autogpt.json file')
		.action(async (options) => {
			await cliCommandGenerateBotProfileJson(options.openapiUrl, options.autogpt)
		})

	cmdline.command('update_bot_profile_json')
		.description('update a .bot_profile.json file from a .openapi_autogpt.json file and a .bot_profile.json file')
		.requiredOption('-o, --openapiUrl <openapiUrl>', 'the url for the openapi.json file')
		.requiredOption('-a, --autogpt <autogptPath>', 'the path for the autogpt.json file')
		.requiredOption('-b, --botProfileName <autogptPath>', 'the botProfileName of the .bot_profile.json to update')
		.action(async (options) => {
			await cliCommandUpdateBotProfileJson(options.openapiUrl, options.autogpt, options.botProfileName)
		})

	// parse command line
	cmdline.parse(process.argv)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	call main async function (without async prefix because of top level await)
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

void mainAsync()
