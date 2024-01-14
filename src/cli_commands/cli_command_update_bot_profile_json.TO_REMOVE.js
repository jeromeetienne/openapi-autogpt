// npm imports
import BotProfileHelper from '../bot_profile_helper.TO_REMOVE.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @param {string} openApiUrl
 * @param {string} autoGptFileName 
 * @param {string} botProfileName
 */
export default async function cliCommandUpdateBotProfileJson(openApiUrl, autoGptFileName, botProfileName) {

	const botProfileToUpdate = await BotProfileHelper.loadBotProfile(botProfileName)
	const botProfileSource = await BotProfileHelper.buildBotProfileFromAutoGpt(openApiUrl, autoGptFileName)

	await BotProfileHelper.updateBotProfileAutoGptFields(botProfileToUpdate, botProfileSource)


	// output the openapi_autogpt.json file
	// console.log(JSON.stringify(botProfileToUpdate, null, '\t'))

	await BotProfileHelper.saveBotProfile(botProfileName, botProfileToUpdate)
}


