///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Here are the variable that define the bot behaviour. 
//	You can modify them to change the bot behaviour to fit your own need.
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} AutoGptJson - configuration for the AutoGpt
 * @property {string[]} userInputExamples - list of example of user input. Thing the user may ask the bot.
 * @property {string} shortGreetingPrompt - message of the day is what you tell the user when he start the bot. this is the welcome message. It describe to the users what the bot can do for him.
 * @property {string} systemMessage - system message is what you tell the bot about the behaviour he should have. This is the instruction he should follow.
 * @property {string} callBaseUrl - the base Url to call the openApi path
 * @property {import('./black_white_list_helper').BlackWhiteList} openApiPathWhiteList
 * @property {import('./black_white_list_helper').BlackWhiteList} openApiPathBlackList
*/
void (0)

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Fake export
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default {}