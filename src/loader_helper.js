// node imports
import Fs from 'fs'
import Path from 'path'

// npm imports
import OpenAPIParser from "@readme/openapi-parser";

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

export default class LoaderHelper {

        /**
         * 
         * @param {string} openApiFileName 
         * @returns 
         */
        static async loadOpenApiJson(openApiFileName) {
                // read the openapi file
                const openApiFileContent = await Fs.promises.readFile(openApiFileName, 'utf-8')
                const openApiJson = await OpenAPIParser.validate(JSON.parse(openApiFileContent))
                // const openApiJson = JSON.parse(openApiFileContent)

                return openApiJson
        }
        /**
         * 
         * @param {string} openApiUrl 
         * @returns 
         */
        static async loadOpenApiJsonFromUrl(openApiUrl) {
                // debugger
                // read the openapi file
                const response = await fetch(openApiUrl)
                const responseJson = await response.json()
  
                const openApiJson = await OpenAPIParser.validate(responseJson)
                // const openApiJson = JSON.parse(openApiFileContent)

                return openApiJson
        }
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        /**
         * 
         * @param {string} autoGptFileName 
         */
        static async loadAutoGptJson(autoGptFileName) {
                // load the autogpt file - support .json and .js
                let autoGptJson = /** @type {import('./type.d.js').AutoGptJson} */({})
                if (autoGptFileName.endsWith('.js')) {
                        const relativePath = Path.relative(__dirname, process.cwd())
                        const importFileName = Path.join(relativePath, autoGptFileName)
                        const autoGptModule = await import(importFileName);
                        autoGptJson = autoGptModule.default
                } else if (autoGptFileName.endsWith('.json')) {
                        // read the autogpt.json file
                        const autoGptFileContent = await Fs.promises.readFile(autoGptFileName, 'utf-8')
                        autoGptJson = /** @type {import('./type.d.js').AutoGptJson} */(JSON.parse(autoGptFileContent))
                } else {
                        console.assert(false, `Unknown file extension for file ${autoGptFileName}`)
                }

		return autoGptJson
        }
}