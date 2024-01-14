// node imports
import ReadlinePromises from "readline/promises"
import Fs from 'fs'
import Path from 'path'

// npm imports
import CliColor from "cli-color"
import OpenAi from 'openai'
// import OpenAPIParser from "@readme/openapi-parser";
import Debug from "debug"

// local imports
import TextSpinner from "../text-spinner.js";
import OpenApiHelperOpenAi from '../openapi_helper_openai.js'
import LoaderHelper from "../loader_helper.js"
// import { OutputParserHelper, OutputParserChatWidgetText, OutputParserBase } from '../../../../src/libs/output_parser_helper.js'
// import WidgetCommandHelperText from '../../../../web/js/widget_command_helper_text.js'

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// MyDebug - setup a debug log function
const debug = Debug('openapi-auogpt')

// NOTE: trick to have __dirname available in ESM modules - https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/#how-does-getting-dirname-back-work
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {string} openApiFileName 
 * @param {string} autoGptFileName 
 */
export default async function cliCommandQuery(openApiFileName, autoGptFileName) {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	build configuration files
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// load the openapi file
	const openApiJson = await LoaderHelper.loadOpenApiJson(openApiFileName)
	// load the autogpt file - support .json and .js
	const autoGptJson = await LoaderHelper.loadAutoGptJson(autoGptFileName)

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	build openaiFunctionCallbacks and openaiFunctionSchemas based on the openapi file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const { openaiFunctionCallbacks, openaiFunctionSchemas } = await OpenApiHelperOpenAi.buildOpenAiFunctions(
		openApiJson,
		autoGptJson.callBaseUrl,
		autoGptJson.openApiPathWhiteList,
		autoGptJson.openApiPathBlackList
	)

	// debug("openaiFunctionCallbacks: ", openaiFunctionCallbacks)
	debug("openaiFunctionSchemas: ", JSON.stringify(openaiFunctionSchemas, null, '\t'))

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	handle readline history
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// init readline history
	let readlineHistory = /** @type {string[]} */([])
	const readlineHistoryPath = Path.join(__dirname, `../../data/openapi_autogpt.readline_history.json`)

	// test if the history file exists
	let historyFileExists = await Fs.promises.access(readlineHistoryPath).then(() => true).catch(() => false)
	if (historyFileExists === true) {
		const fileContent = await Fs.promises.readFile(readlineHistoryPath, 'utf-8')
		readlineHistory = JSON.parse(fileContent)
	}

	// init readline
	const readline = ReadlinePromises.createInterface({
		input: process.stdin,
		output: process.stdout,
		history: readlineHistory
	})

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const openAiApi = new OpenAi({
		apiKey: process.env.OPENAI_API_KEY,
	})

	/**
	 * @type {OpenAi.Chat.Completions.ChatCompletionMessageParam[]}
	 */
	const chatMessages = [
		{ role: "system", content: autoGptJson.systemMessage },
	]

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	main loop
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const textSpinner = new TextSpinner()


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	console.log()
	displayInlineHelp(autoGptJson)

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// display start message
	console.log()
	console.log(CliColor.cyan(autoGptJson.shortGreetingPrompt))

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// if(false){
	// 	// just to debug the widget command
	// 	const widgetCommandJson = /** @type {import('../../../../src/type.d.js').WidgetCommandJson} */({
	// 		"type": "shopifyShowProducts",
	// 		"data": {
	// 			"productIds": [
	// 				'adapt-camo-seamless-track-jacket_45766347522332',
	// 				'adapt-camo-seamless-track-jacket_45766347555100',
	// 				'adapt-camo-seamless-track-jacket_45766347587868',
	// 				'adapt-camo-seamless-track-jacket_45766347620636'
	// 			]
	// 		}
	// 	})
	// 	const responseText = await WidgetCommandHelperText.processCommandJson(widgetCommandJson)
	// 	console.log(responseText)
	// }
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	main loop
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////


	while (true) {
		const latestMessage = chatMessages[chatMessages.length - 1]
		if (latestMessage.role === 'function') {
			// do nothing - latest message is a function response
		} else {
			// skip a line
			console.log()

			// get the user input
			let userInput = await readline.question(CliColor.green('>> '))
			userInput = userInput.trim()

			// if userInput is empty, considere that as the user willing to exit
			if (userInput === '') break

			if (userInput === '?') {
				displayInlineHelp(autoGptJson)
				continue
			}

			// push the user input
			chatMessages.push(/** @type {OpenAi.Chat.Completions.ChatCompletionMessageParam} */({
				role: "user",
				content: userInput,
			}))
		}

		debug(`OpenAI createChatCompletion - chatMessages: ${JSON.stringify(chatMessages, null, '\t')}`)

		// display a spinner
		textSpinner.start()
		// run the chain
		let callResult = null
		try {
			// debugger
			callResult = await openAiApi.chat.completions.create({
				model: "gpt-3.5-turbo-0613",
				// model: 'gpt-3.5-turbo-1106',
				// model: "gpt-4-0613",
				// model: 'gpt-4-1106-preview',

				messages: chatMessages,
				functions: openaiFunctionSchemas,
				temperature: 0.0,
				// temperature: 0.2,
			});
		} catch (error) {
			debugger
			console.log(error)
			console.assert(false, `OpenAI api error: ${CliColor.red(error.message)}, chatMessages: ${JSON.stringify(chatMessages, null, '\t')}`)
			// debugger
		}

		const responseMessage = callResult?.choices[0].message

		if (responseMessage) {
			chatMessages.push(responseMessage)
		}

		// process function call from the model
		if (responseMessage?.function_call) {

			// call the function
			const functionName = responseMessage.function_call.name || ''
			let functionArgs = null
			try {
				let argumentsString = responseMessage.function_call.arguments || '{}'
				functionArgs = responseMessage.function_call.arguments ? JSON.parse(argumentsString) : {}
			} catch (e) {
				debugger
			}

			// log to debug
			debug(`OpenAI response - Function ${functionName} requested by OpenAI api`)
			debug(`Function ${functionName} - args: ${JSON.stringify(functionArgs)}`)

			// sanity check - ensure the function name is known
			console.assert(functionName in openaiFunctionCallbacks, `Unknown function name: ${functionName}`)

			// call the function
			const functionToCall = openaiFunctionCallbacks[functionName]
			const functionResult = await functionToCall(functionArgs)

			// log to debug
			debug(`Function ${functionName} - response: ${JSON.stringify(functionResult)}`)

			// add the function response in the chatMessages
			const chatMessage = /** @type {OpenAi.Chat.Completions.ChatCompletionMessageParam} */({
				role: "function",
				name: functionName,
				content: functionResult.text,
			})

			// push a message for the function response
			chatMessages.push(chatMessage)

			// // process the widget command if there is any
			// if (functionResult.widgetCommand !== null) {
			// 	const widgetCommandJson = /** @type {import('../../../../src/type.d.js').WidgetCommandJson} */(JSON.parse(functionResult.widgetCommand))
			// 	responseMessage.content = await WidgetCommandHelperText.processCommandJson(widgetCommandJson)
			// }
		}

		// hide the spinner
		textSpinner.stop()

		// ///////////////////////////////////////////////////////////////////////////////
		// ///////////////////////////////////////////////////////////////////////////////
		// //	output parser for chat widget 
		// ///////////////////////////////////////////////////////////////////////////////
		// ///////////////////////////////////////////////////////////////////////////////

		// // TODO to be removed when widgetCommandJson is handled
		// // output parser for chat widget 
		// if (responseMessage?.content) {
		// 	// TODO to be removed when widgetCommandJson is handled
		// 	const outputParsers = /** @type {OutputParserBase[]} */([
		// 		// FIXME this hardcoded address is crappy - it will fails when we deploy
		// 		new OutputParserChatWidgetText('http://localhost:3000')
		// 	])
		// 	responseMessage.content = await OutputParserHelper.processOutput(outputParsers, responseMessage.content)
		// }

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// display content is there is any
		if (responseMessage?.content) {
			debug(`OpenAI response - content "${responseMessage.content}"`)

			console.log(' ')
			console.log(`${CliColor.magentaBright(responseMessage.content.trim())}`)
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	handle exit
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// display exit message
	console.log(CliColor.cyan('Bye.'))

	// close readline
	readline.close()

	// save readline history 
	// @ts-ignore
	await Fs.promises.writeFile(readlineHistoryPath, JSON.stringify(readline.history, null, '\t'), 'utf-8')
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * 
 * @param {import("../type.d.js").AutoGptJson} autoGptJson 
 */
function displayInlineHelp(autoGptJson) {
	const colorFct = CliColor.cyan

	console.log(colorFct('Inline Help:'))
	console.log(colorFct('- ?    : display this inline help.'))
	console.log(colorFct('- Enter: aka an empty message. It will exit the program.'))

	if (autoGptJson.userInputExamples.length > 0) {
		console.log('')
		console.log(colorFct('Here is a list of things you can ask me:'))
		console.log(colorFct(autoGptJson.userInputExamples.map((example) => `- ${example}`).join('\n')))
	}
}

