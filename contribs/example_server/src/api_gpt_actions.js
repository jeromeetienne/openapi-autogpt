// npm imports
import Express from 'express'
import Zod from "zod";

// langchain imports
import { Document } from "@langchain/core/documents";
import { OpenAI, ChatOpenAI } from "@langchain/openai";
import { loadSummarizationChain, createTaggingChainFromZod,createExtractionChainFromZod } from "langchain/chains";

// local imports
import expressApiCache from './express_api_cache.js'

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
//	expressRouter
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

var expressRouter = Express.Router()

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Return the content of a page, after scrapping, and conversion to markdown
 * - from https://js.langchain.com/docs/modules/chains/openai_functions/#extraction
 */
expressRouter.get('/named-entities', expressApiCache(10), async (request, response) => {
	const pageContent = /** @type {string} */(request.query.pageContent)

	// Create the model
	const model = new ChatOpenAI({ 
		modelName: "gpt-3.5-turbo-0613", 	// -0613 is required for OpenAI Function
		temperature: 0,
		cache: true,
		verbose: true,
	})

	// build the zod schema
	const responseZodSchema = Zod.object({
		personName: Zod.string(),
		personAge: Zod.number(),
		personHairColor: Zod.string(),
		dogName: Zod.string(),
		dogBreed: Zod.string(),
	})

	// build the chain
	const chain = createExtractionChainFromZod(responseZodSchema, model)

	// run the chain
	const callResultStr = await chain.run(pageContent)

	// NOTE: workaround a type issue in the chain.run() function - it returns a object but declare to return a string
	const callResult = typeof(callResultStr) === 'string' ? JSON.parse(callResultStr) : callResultStr

	// build response from the call result
	const reponseJson = /** @type {import('./type.d.js').GptNamedEntitiesResult} */(callResult)
	return response.json(reponseJson)
})


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Return the content of a page, after scrapping, and conversion to markdown
 * - from https://js.langchain.com/docs/modules/chains/openai_functions/#tagging
 */
expressRouter.get('/sentimentTagging', expressApiCache(10), async (request, response) => {
	const pageContent = /** @type {string} */(request.query.pageContent)

	// Create the model
	const model = new ChatOpenAI({ 
		modelName: "gpt-3.5-turbo-0613", 	// -0613 is required for OpenAI Function
		temperature: 0,
		cache: true,
		verbose: true,
	})

	// build the zod schema
	const responseZodSchema = Zod.object({
		sentiment: Zod.string().optional().describe('sentiment expressed like "positive", "negative", "neutral"'),
		tone: Zod.number().describe('tone expressed between 0 and 10. 0 is very negative, 5 neutral, and 10 very positive'),
		language: Zod.string().optional().describe('language expressed like "english", "french", "spanish"'),
	})

	// build the chain
	const chain = createTaggingChainFromZod(responseZodSchema, model)

	// run the chain
	const callResultStr = await chain.run(pageContent)

	// NOTE: workaround a type issue in the chain.run() function - it returns a object but declare to return a string
	const callResult = typeof(callResultStr) === 'string' ? JSON.parse(callResultStr) : callResultStr

	// build response from the call result
	const reponseJson = /** @type {import('./type.d.js').GptTaggingResult} */({
		sentiment: callResult.sentiment || 'n/a',
		tone: callResult.tone || 'n/a',
		language: callResult.language || 'n/a',
	})
	return response.json(reponseJson)
})

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Return the content of a page, after scrapping, and conversion to markdown
 * 
 * - from https://js.langchain.com/docs/modules/chains/other_chains/summarization
 */
expressRouter.get('/summarization', expressApiCache(10), async (request, response) => {
	const pageContent = /** @type {string} */(request.query.pageContent)

	// create the document from page content
	const document = new Document({
		pageContent: pageContent,
		metadata: {
			source: 'summarization API'
		},
	})

	// create the model
	const model = new OpenAI({
		modelName: "gpt-3.5-turbo",
		temperature: 0,
		cache: true,
		// cache: await ModelCacheManager.getOpenAiCacheOptions(),
	});

	// Create the chain
	const chain = loadSummarizationChain(model, { 
		type: "map_reduce" 
	});

	// run the chain
	const callResult = await chain.call({
		input_documents: [document],
	});

	// build response from the call result
	const reponseJson = /** @type {import('./type.d.js').GptSummarizationResult} */({
		summary: callResult.text
	})
	return response.json(reponseJson)
})

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
//	
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

async function init() {
}

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
//	Export from the module
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////


export default class ServerApiGptActions {
	static init = init;

	static expressRouter = expressRouter;
}

