// node imports
import Path from 'path'

// 3rd party imports
import OpenAi from 'openai'

// local imports
import BlackWhiteListHelper from './black_white_list_helper.js'
// import WidgetCommandConstants from '../../web/js/widget_command_constants.js'

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	jsdoc typedefs
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * the result of MyOpenaiCallback
 * @typedef {object} MyOpenaiCallbackResult
 * @property {string} text
 * @property {string|null} widgetCommand
 */
void (0)

/**
 * This callback which is called by the openai function
 * @callback MyOpenaiCallback
 * @param {Object<string, any>} inputObject
 * @returns {Promise<MyOpenaiCallbackResult>}
 */
void (0)


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Static helper methods to build the functionConfig for the openApi functions	
 */
export default class OpenApiHelperOpenAi {

	/**
	 * 
	 * @param {object} openApiJson 
	 * @param {string} callBaseUrl - the base url to call the api
	 * @param {import('./black_white_list_helper.js').BlackWhiteList} openApiPathWhiteList - the list of api paths to include
	 * @param {import('./black_white_list_helper.js').BlackWhiteList} openApiPathBlackList - the list of api paths to exclude
	 */
	static async buildOpenAiFunctions(openApiJson, callBaseUrl, openApiPathWhiteList, openApiPathBlackList) {
		const openaiFunctionCallbacks = /** @type {Object.<string, MyOpenaiCallback>} */({})
		const openaiFunctionSchemas = /** @type {OpenAi.Chat.Completions.ChatCompletionCreateParams.Function[]} */([])

		// @ts-ignore
		const apiPaths = /**@type {string[]} */(Object.keys(openApiJson.paths))

		for (const apiPath of apiPaths) {
			// if apiPath is not filtered, skip it
			const isFiltered = await BlackWhiteListHelper.filter(apiPath, openApiPathWhiteList, openApiPathBlackList)
			if (isFiltered === false) continue

			const possibleOperations = ['get', 'post']
			for (const operation of possibleOperations) {
				// if operation is not defined, skip it
				if (openApiJson.paths[apiPath][operation] === undefined) continue

				// build the function schema
				const functionSchema = OpenApiHelperOpenAi._buildFunctionSchema(openApiJson, callBaseUrl, apiPath, operation)
				openaiFunctionSchemas.push(functionSchema)

				// build the function callback
				const functionCallback = OpenApiHelperOpenAi._buildCallback(openApiJson, callBaseUrl, apiPath, operation)
				openaiFunctionCallbacks[functionSchema.name] = functionCallback
			}
		}

		return { openaiFunctionCallbacks, openaiFunctionSchemas }
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {object} openApiJson 
	 * @param {string} baseUrl 
	 * @param {string} apiPath 
	 * @param {string} method
	 * @returns 
	*/
	static _buildFunctionSchema(openApiJson, baseUrl, apiPath, method) {
		// build the function schema
		const methodSchema = openApiJson.paths[apiPath][method]

		// from here https://platform.openai.com/docs/guides/gpt/function-calling
		const functionSchema = {
			name: Path.basename(apiPath),
			description: methodSchema.description,
			// responses: methodSchema.responses,
			parameters: {
				type: 'object',
				properties: {},
				required: /** @type {string[]} */([]),
			}
		}
		if (methodSchema.parameters) {
			for (const parameterSchema of methodSchema.parameters) {
				functionSchema.parameters.properties[parameterSchema.name] = {
					type: parameterSchema.schema.type,
					description: parameterSchema.description,
					example: parameterSchema.example,
				}
				if (parameterSchema.required) {
					functionSchema.parameters.required.push(parameterSchema.name)
				}
			}
			// debugger
			// console.assert(false, 'only debug')
			// functionSchema.parameters = JSON.parse(JSON.stringify(parametersSchema))

			/* FROM
			[
				{
					"name": "botProfileName",
					"in": "query",
					"description": "name of the bot profile",
					"schema": {
						"type": "string"
					},
					"example": "wikipedia_batman"
				}
			] */
			/* TO
			 {
				"type": "object",
				"properties": {
					"query": {
						"type": "string",
						"description": "the GraphQL query to execute",
						"example": "{hello}"
					}
				}
			}
			 */
		} else if (methodSchema?.requestBody?.content['application/json']?.schema) {
			const parametersSchema = methodSchema.requestBody.content['application/json'].schema
			functionSchema.parameters = JSON.parse(JSON.stringify(parametersSchema))
			// functionSchema.parameters.required = Object.keys(parametersSchema)
		}

		delete functionSchema.parameters['additionalProperties']

		// read the parameters
		return functionSchema
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {object} openApiJson 
	 * @param {string} baseUrl 
	 * @param {string} apiPath 
	 * @param {string} method
	 * @returns {MyOpenaiCallback}
	*/
	static _buildCallback(openApiJson, baseUrl, apiPath, method) {
		/**
		 * 
		 * @param {object} inputObject 
		 */
		return async (inputObject) => {
			const urlParams = new URLSearchParams()

			let fetchOptions = {}
			if (method === 'get') {
				// NOTE assume it is "in": "query" ... 
				// TODO to do the sanity check !!
				for (const parameterName of Object.keys(inputObject)) {
					urlParams.set(parameterName, inputObject[parameterName])
				}

			} else if (method === 'post') {
				// TODO handle the uri parameters
				fetchOptions = {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(inputObject),
				}
			} else {
				console.assert(false, `method ${method} not supported`)
			}

			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////
			//	do actual fetch
			///////////////////////////////////////////////////////////////////////////////
			///////////////////////////////////////////////////////////////////////////////

			const callUrl = `${baseUrl}${apiPath}${urlParams.toString().length > 0 ? '?' : ''}${urlParams}`
			let response
			try {
				response = await fetch(callUrl, fetchOptions)
			} catch (error) {
				console.dir(error)
				if (error.cause?.code === 'ECONNREFUSED') {
					const errorString = `ERROR: fetch failed for "${callUrl}" due to cause.code ${error.cause?.code}`
					console.error(errorString)
					return {
						text: errorString,
						widgetCommand: null,
					}
				}
				// debugger
				const errorString = `ERROR: fetch failed for "${callUrl}" due to exception ${error.message}`
				console.error(errorString)
				return {
					text: errorString,
					widgetCommand: null,
				}
			}
			if (response.ok === false) {
				const errorString = `ERROR: fetch failed for "${callUrl}" with status ${response.status} - ${response.statusText}`
				console.error(errorString)
				return {
					text: errorString,
					widgetCommand: null,
				}
			}

			// console.log(`fetch response header for "${callUrl}"`,response.headers)

			// // detect if there is a widget command in the response header
			// let widgetCommand = null;
			// if(response.headers.get(WidgetCommandConstants.httpHeaderName) !== null) {
			// 	widgetCommand = response.headers.get(WidgetCommandConstants.httpHeaderName)
			// }


			const responseJSon = await response.json()

			return {
				text: JSON.stringify(responseJSon),
				// widgetCommand: widgetCommand,
			}
		}
	}

}