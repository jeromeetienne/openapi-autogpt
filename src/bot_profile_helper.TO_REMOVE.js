// node imports
import Fs from 'fs'
import Path from 'path'

// Local imports
import LoaderHelper from './loader_helper.js';
import BotProfileConstants from '../../../web/js/bot_profile_constants.js';


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// NOTE: trick to have __dirname available in ESM modules - https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/#how-does-getting-dirname-back-work
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export default class BotProfileHelper {

        /**
         * 
         * @param {import('../../../src/type.d.js').BotProfile} botProfileToUpdate 
         * @param {import('../../../src/type.d.js').BotProfile} botProfileDefaultAutoGpt 
         */
        static async updateBotProfileAutoGptFields(botProfileToUpdate, botProfileDefaultAutoGpt) {
                const botOptionToUpdate = /** @type {import('../../../src/type.d.js').BotOptionsOpenApiQa} */(botProfileToUpdate.profileOptions)
                const botOptionDefaultAutoGpt = /** @type {import('../../../src/type.d.js').BotOptionsOpenApiQa} */(botProfileDefaultAutoGpt.profileOptions)

                // sanity check
                const isOpenApiQa = botProfileToUpdate.profileType === BotProfileConstants.profileType_openapi_qa_openai || botProfileToUpdate.profileType === BotProfileConstants.profileType_openapi_qa_langchain        
                console.assert(isOpenApiQa === true, `profileType MUST be ${BotProfileConstants.profileType_openapi_qa_openai} or similar`)

                botProfileToUpdate.shortGreetingPrompt = botProfileDefaultAutoGpt.shortGreetingPrompt
                botProfileToUpdate.userInputExamples = botProfileDefaultAutoGpt.userInputExamples
                botOptionToUpdate.serverBaseUrl = botOptionDefaultAutoGpt.serverBaseUrl
                botOptionToUpdate.openApiUrl = botOptionDefaultAutoGpt.openApiUrl
                botOptionToUpdate.openApiPathWhiteList = botOptionDefaultAutoGpt.openApiPathWhiteList
                botOptionToUpdate.openApiPathBlackList = botOptionDefaultAutoGpt.openApiPathBlackList
                botOptionToUpdate.systemMessage = botOptionDefaultAutoGpt.systemMessage
        }

        /**
         * @param {string} openApiUrl
         * @param {string} autoGptFileName 
         */
        static async buildBotProfileFromAutoGpt(openApiUrl, autoGptFileName) {

                // load the openapi file
                const openApiJson = await LoaderHelper.loadOpenApiJsonFromUrl(openApiUrl)
                // load the autogpt file - support .json and .js
                const autoGptJson = await LoaderHelper.loadAutoGptJson(autoGptFileName)

                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////
                //	
                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////

                // cheap and dirty conversion - no check - works for now
                const botProfile = /** @type {import('../../../src/type.d.js').BotProfile} */({
                        humanName: openApiJson.info.title,
                        botProfileName: openApiJson.info.title.toLowerCase().replace(/ /g, '_'),
                        description: openApiJson.info.description,
                        shortGreetingPrompt: autoGptJson.shortGreetingPrompt,
                        userInputExamples: autoGptJson.userInputExamples,
                        profileType: BotProfileConstants.profileType_openapi_qa_openai,
                        profileOptions: {
                                serverBaseUrl: autoGptJson.callBaseUrl,
                                openApiUrl: openApiUrl,
                                openApiPathWhiteList: autoGptJson.openApiPathWhiteList,
                                openApiPathBlackList: autoGptJson.openApiPathBlackList,
                                temperature: 0.2,
                                systemMessage: autoGptJson.systemMessage,
                        }
                })

                return botProfile
        }

        /**
         * 
         * @param {string} botProfileName 
         * @returns 
         */
        static async loadBotProfile(botProfileName) {
                const filePath = Path.join(__dirname, `../../../data/bot_profiles/${botProfileName}.bot_profile.json`)

                // check if the file exists
                let fileExists = await Fs.promises.access(filePath).then(() => true).catch(() => false)
                if (fileExists === false) {
                        console.error(`Bot profile ${botProfileName} not found.`)
                        throw new Error(`Bot profile ${botProfileName} not found.`)
                }

                // load bot profile file
                const fileContent = await Fs.promises.readFile(filePath, 'utf8')
                const botProfile = /** @type {import('../../../src/type.d.js').BotProfile} */(JSON.parse(fileContent))

                return botProfile
        }


        /**
         * 
         * @param {string} botProfileName 
         * @param {import('../../../src/type.d.js').BotProfile} botProfile
         */
        static async saveBotProfile(botProfileName, botProfile) {
                const filePath = Path.join(__dirname, `../../../data/bot_profiles/${botProfileName}.bot_profile.json`)

                // load bot profile file
                const fileContent = JSON.stringify(botProfile, null, '\t')
                await Fs.promises.writeFile(filePath, fileContent, 'utf8')
        }
}