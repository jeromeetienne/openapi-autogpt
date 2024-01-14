// npm imports
import Express from 'express'
import Puppeteer from 'puppeteer'

// langchain imports
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";

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

const puppeteerBrowser = await Puppeteer.launch({
	headless: 'new'
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

expressRouter.get('/topics', expressApiCache(10), async (request, response) => {
	const pageUrl = 'https://news.ycombinator.com/'
	const puppeteerPage = await puppeteerBrowser.newPage();
	await puppeteerPage.goto(pageUrl);


	// Evaluate JavaScript
	const topicItems = await puppeteerPage.evaluate(() => {
		// @ts-ignore
		const athingEls = /** @type {HTMLElement[]} */([...document.querySelectorAll(".athing")])
		const subtextEls = /** @type {HTMLElement[]} */([...document.querySelectorAll(".athing + tr .subtext")])
		const topicItems =  /** @type {import('../type.d.js').HNTopicsItem[]} */([])
		for (const athingEl of athingEls) {
			const athingIndex = athingEls.indexOf(athingEl)
			const subtextEl = subtextEls[athingIndex]

			// get absolute url of this topic
			const titleLineEl = athingEl.querySelector(".titleline")
			const titleEl = titleLineEl?.querySelector("a")
			const plainHrefUrl = titleEl?.getAttribute("href") || ""
			const absoluteUrl = new URL(plainHrefUrl, window.location.href).href


			// get upVotesCount
			const upVotesCountEl = /** @type {HTMLElement} */(subtextEl.querySelector(".score"))
			const upVotesCount = upVotesCountEl ? parseInt(upVotesCountEl.innerText) : 0

			// get commentsCount
			const allAnchorsEl = /** @type {HTMLElement[]} */([...subtextEl.querySelectorAll("a")])
			const lastAnchorEl = allAnchorsEl[allAnchorsEl.length - 1]
			const commentsCount = lastAnchorEl ? parseInt(lastAnchorEl.innerText) : 0

			// build hnTitle
			const hnTopicsItem = /** @type {import('../type.d.js').HNTopicsItem} */({
				title: titleEl?.textContent,
				url: absoluteUrl,
				upVotesCount: upVotesCount,
				commentsCount: commentsCount,
			})
			topicItems.push(hnTopicsItem)
		}
		return topicItems
	})
	console.log({ topicItems })

	const hnTopicsResult = /** @type {import('../type.d.js').HNTopicsResult} */({
		topicItems: topicItems
	})

	response.json(hnTopicsResult)
})

/**
 * Return the content of a page, after scrapping, and conversion to markdown
 */
expressRouter.get('/pageContent', expressApiCache(10), async (request, response) => {
	const webPageUrl = /** @type {string} */(request.query.pageUrl)

	// load document
	const documentLoader = new CheerioWebBaseLoader(webPageUrl);
	const loadedDocuments = await documentLoader.load();

	// build response
	const reponseJson = /** @type {import('../type.d.js').HNContentResult} */({
		pageContent: loadedDocuments[0].pageContent.trim()
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

export default class ServerApiHackerNews {
	static init = init;

	static expressRouter = expressRouter;
}

